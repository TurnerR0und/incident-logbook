from datetime import datetime, timezone

from app.models.incident import IncidentSeverity


async def test_create_incident(client, auth_headers):
    headers = await auth_headers("creator@example.com")

    response = await client.post(
        "/incidents",
        json={
            "title": "Checkout latency",
            "description": "p95 latency exceeded target",
            "severity": "HIGH",
        },
        headers=headers,
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["title"] == "Checkout latency"
    assert payload["status"] == "OPEN"
    assert payload["severity"] == "HIGH"
    assert payload["resolved_at"] is None
    assert payload["owner_email"] == "creator@example.com"


async def test_update_to_resolved_sets_resolved_at(client, auth_headers):
    headers = await auth_headers("resolver@example.com")

    create_response = await client.post(
        "/incidents",
        json={
            "title": "Queue backlog",
            "description": "Jobs are delayed",
            "severity": "MEDIUM",
        },
        headers=headers,
    )
    assert create_response.status_code == 200
    incident_id = create_response.json()["id"]

    response = await client.patch(
        f"/incidents/{incident_id}",
        json={"status": "RESOLVED"},
        headers=headers,
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "RESOLVED"
    assert payload["resolved_at"] is not None


async def test_updating_closed_incident_returns_400(client, auth_headers):
    headers = await auth_headers("closer@example.com")

    create_response = await client.post(
        "/incidents",
        json={
            "title": "Search outage",
            "description": "Search API unavailable",
            "severity": "CRITICAL",
        },
        headers=headers,
    )
    assert create_response.status_code == 200
    incident_id = create_response.json()["id"]

    close_response = await client.patch(
        f"/incidents/{incident_id}",
        json={"status": "CLOSED"},
        headers=headers,
    )
    assert close_response.status_code == 200

    response = await client.patch(
        f"/incidents/{incident_id}",
        json={"title": "Updated title"},
        headers=headers,
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "This incident is CLOSED and cannot be modified."


async def test_update_creates_system_comments_for_full_incident_edits(client, auth_headers):
    headers = await auth_headers("editor@example.com")

    create_response = await client.post(
        "/incidents",
        json={
            "title": "Checkout latency",
            "description": "p95 latency exceeded target",
            "severity": "HIGH",
        },
        headers=headers,
    )
    assert create_response.status_code == 200
    incident_id = create_response.json()["id"]

    update_response = await client.patch(
        f"/incidents/{incident_id}",
        json={
            "title": "Checkout latency spike",
            "description": "p95 latency exceeded target for the checkout API",
            "severity": "CRITICAL",
            "status": "INVESTIGATING",
            "root_cause": "Connection pool starvation during failover",
        },
        headers=headers,
    )

    assert update_response.status_code == 200
    payload = update_response.json()
    assert payload["title"] == "Checkout latency spike"
    assert payload["description"] == "p95 latency exceeded target for the checkout API"
    assert payload["severity"] == "CRITICAL"
    assert payload["status"] == "INVESTIGATING"
    assert payload["root_cause"] == "Connection pool starvation during failover"

    comments_response = await client.get(
        f"/incidents/{incident_id}/comments",
        headers=headers,
    )

    assert comments_response.status_code == 200
    bodies = [comment["body"] for comment in comments_response.json()]
    assert "System: Status changed from OPEN to INVESTIGATING by editor@example.com" in bodies
    assert "System: Severity changed from HIGH to CRITICAL by editor@example.com" in bodies
    assert (
        'System: Title updated from "Checkout latency" to "Checkout latency spike" by editor@example.com'
        in bodies
    )
    assert "System: Description updated by editor@example.com" in bodies
    assert "System: Root cause updated by editor@example.com" in bodies


async def test_created_after_filters_incidents_by_timeframe(
    client,
    create_user,
    login_headers,
    create_incident,
):
    user = await create_user("filter-owner@example.com")
    headers = await login_headers("filter-owner@example.com")

    old_incident = await create_incident(
        user.id,
        title="Old incident",
        severity=IncidentSeverity.HIGH,
        created_at=datetime(2026, 1, 15, 12, 0, tzinfo=timezone.utc),
    )
    new_incident = await create_incident(
        user.id,
        title="New incident",
        severity=IncidentSeverity.CRITICAL,
        created_at=datetime(2026, 2, 15, 12, 0, tzinfo=timezone.utc),
    )

    response = await client.get(
        "/incidents",
        params={"created_after": "2026-02-01T00:00:00Z"},
        headers=headers,
    )

    assert response.status_code == 200
    payload = response.json()
    returned_ids = {item["id"] for item in payload}
    assert str(new_incident.id) in returned_ids
    assert str(old_incident.id) not in returned_ids


async def test_admin_can_filter_incidents_by_owner_email(
    client,
    auth_headers,
    create_user,
    create_incident,
):
    admin_headers = await auth_headers("admin-filter@example.com", is_admin=True)
    matching_owner = await create_user("alice@example.com")
    other_owner = await create_user("bob@example.com")

    alice_incident = await create_incident(matching_owner.id, title="Alice issue")
    await create_incident(other_owner.id, title="Bob issue")

    response = await client.get(
        "/incidents",
        params={"owner_email": "ali"},
        headers=admin_headers,
    )

    assert response.status_code == 200
    payload = response.json()
    returned_ids = {item["id"] for item in payload}
    assert str(alice_incident.id) in returned_ids
    assert all(item["owner_email"] == "alice@example.com" for item in payload)


async def test_standard_user_cannot_filter_incidents_by_owner_email(
    client,
    auth_headers,
):
    headers = await auth_headers("standard-filter@example.com")

    response = await client.get(
        "/incidents",
        params={"owner_email": "someone"},
        headers=headers,
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Only admins can filter incidents by user"
