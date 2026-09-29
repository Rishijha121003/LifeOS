from app.models.resource import Resource

def test_get_resources(client, db_session):
    # Insert resources
    r1 = Resource(title="FastAPI Documentation", description="Docs", url="https://fastapi.tiangolo.com/", category="Backend", order_index=1)
    r2 = Resource(title="NeetCode 150 Algorithms", description="DSA", url="https://neetcode.io/practice", category="DSA", order_index=2)
    r3 = Resource(title="ByteByteGo System Design", description="HLD", url="https://bytebytego.com/", category="System Design", order_index=3)
    db_session.add_all([r1, r2, r3])
    db_session.commit()

    response = client.get("/api/v1/resources/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3
    titles = [r["title"] for r in data]
    assert "FastAPI Documentation" in titles
    assert "NeetCode 150 Algorithms" in titles
    assert "ByteByteGo System Design" in titles
    for r in data:
        assert "url" in r and r["url"].startswith("http")
