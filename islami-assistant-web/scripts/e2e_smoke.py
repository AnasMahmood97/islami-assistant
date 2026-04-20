import http.cookiejar
import json
import pathlib
import sys
import urllib.parse
import urllib.request
import urllib.error

BASE = "http://localhost:3000"


def make_opener():
    jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    return opener


def request_json(opener, url, method="GET", data=None, headers=None):
    req = urllib.request.Request(url, method=method, headers=headers or {})
    if data is not None:
        req.data = data
    try:
        with opener.open(req, timeout=30) as resp:
            body = resp.read().decode("utf-8", "ignore")
            return resp.getcode(), body
    except urllib.error.HTTPError as err:
        return err.code, err.read().decode("utf-8", "ignore")


def post_form(opener, url, form_dict):
    payload = urllib.parse.urlencode(form_dict).encode("utf-8")
    return request_json(
        opener,
        url,
        method="POST",
        data=payload,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )


def post_json(opener, url, payload_dict):
    payload = json.dumps(payload_dict).encode("utf-8")
    return request_json(
        opener,
        url,
        method="POST",
        data=payload,
        headers={"Content-Type": "application/json"},
    )


def login(username: str, password: str):
    opener = make_opener()
    _, csrf_body = request_json(opener, f"{BASE}/api/auth/csrf")
    csrf = json.loads(csrf_body)["csrfToken"]
    payload = {
        "csrfToken": csrf,
        "username": username,
        "password": password,
        "callbackUrl": f"{BASE}/chat",
        "json": "true",
    }
    code, body = post_form(opener, f"{BASE}/api/auth/callback/credentials", payload)
    if code not in (200, 302):
        raise RuntimeError(f"Login failed for {username}: {code} {body[:200]}")
    return opener


def ensure_ok(code: int, body: str, label: str):
    if code < 200 or code > 299:
        raise RuntimeError(f"{label} failed: {code} {body[:300]}")


def post_multipart_file(opener, url, field_name, file_path):
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    file_bytes = file_path.read_bytes()
    filename = file_path.name
    head = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"\r\n'
        "Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n"
    ).encode("utf-8")
    tail = f"\r\n--{boundary}--\r\n".encode("utf-8")
    payload = head + file_bytes + tail
    return request_json(
        opener,
        url,
        method="POST",
        data=payload,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    )


def main():
    admin = login("admin", "Admin@123")

    companies_file = pathlib.Path("public/data/قائمة الشركات المعتمدة بداية 2025.xlsx")
    if not companies_file.exists():
        raise RuntimeError("Companies file not found in public/data/")
    code, body = post_multipart_file(admin, f"{BASE}/api/finance-companies", "file", companies_file)
    ensure_ok(code, body, "admin companies import")
    import_result = json.loads(body)

    code, body = post_json(
        admin,
        f"{BASE}/api/admin/users",
        {"name": "E2E Employee", "username": "e2e_emp", "password": "Emp@123", "role": "EMPLOYEE"},
    )
    if code not in (200, 201):
        # If already exists, continue
        if code not in (400, 409, 500):
            raise RuntimeError(f"employee create unexpected: {code} {body[:200]}")

    emp = login("e2e_emp", "Emp@123")
    code, body = post_json(
        emp,
        f"{BASE}/api/links",
        {"label": "My Private ICBS", "url": "https://example.org/icbs", "isPrivate": True},
    )
    ensure_ok(code, body, "employee private link create")

    code, body = post_json(
        emp,
        f"{BASE}/api/credentials",
        {"system": "ICBS", "username": "emp.user", "password": "EmpSecret123!"},
    )
    ensure_ok(code, body, "employee credential create")

    code, body = request_json(emp, f"{BASE}/api/credentials")
    ensure_ok(code, body, "employee credentials list")
    rows = json.loads(body)
    match = next((r for r in rows if r.get("system") == "ICBS" and r.get("username") == "emp.user"), None)
    if not match:
        raise RuntimeError("ICBS credential row not found for employee")
    if match.get("password") != "EmpSecret123!":
        raise RuntimeError("Decrypted password mismatch in credentials API")

    code, body = request_json(emp, f"{BASE}/api/links")
    ensure_ok(code, body, "employee links list")
    links_data = json.loads(body)
    private_rows = links_data.get("private", [])
    if not any((row.get("label") or row.get("system")) == "My Private ICBS" for row in private_rows):
        raise RuntimeError("Employee private link not returned in API")

    print(
        json.dumps(
            {
                "ok": True,
                "companies_imported": import_result.get("imported"),
                "private_links_count": len(private_rows),
                "credentials_count": len(rows),
                "eye_copy_ready": True,
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(str(exc))
        sys.exit(1)
