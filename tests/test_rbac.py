async def test_admin_can_view_incident_they_do_not_own(
    client,
    auth_headers,
    create_user,
    create_incident,
):
    admin_headers = await auth_headers(
        "admin@example.com",
        is_admin=True,
    )
    owner = await create_user("owner@example.com")
    incident = await create_incident(owner.id)

    response = await client.get(
        f"/incidents/{incident.id}",
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["id"] == str(incident.id)


async def test_standard_user_cannot_view_incident_they_do_not_own(
    client,
    auth_headers,
    create_user,
    create_incident,
):
    user_headers = await auth_headers("viewer@example.com")
    owner = await create_user("owner@example.com")
    incident = await create_incident(owner.id)

    response = await client.get(
        f"/incidents/{incident.id}",
        headers=user_headers,
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Not authorized to view this incident"
