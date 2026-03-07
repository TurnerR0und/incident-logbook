async def test_register_user(client):
    response = await client.post(
        "/auth/register",
        json={"email": "user@example.com", "password": "password123"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["email"] == "user@example.com"
    assert payload["is_admin"] is False
    assert "id" in payload
    assert "created_at" in payload


async def test_login_returns_jwt(client):
    register_response = await client.post(
        "/auth/register",
        json={"email": "login@example.com", "password": "password123"},
    )
    assert register_response.status_code == 200

    response = await client.post(
        "/auth/login",
        data={"username": "login@example.com", "password": "password123"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["token_type"] == "bearer"
    assert isinstance(payload["access_token"], str)
    assert payload["access_token"]


async def test_register_duplicate_email_returns_400(client):
    first_response = await client.post(
        "/auth/register",
        json={"email": "duplicate@example.com", "password": "password123"},
    )
    assert first_response.status_code == 200

    response = await client.post(
        "/auth/register",
        json={"email": "duplicate@example.com", "password": "password123"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"
