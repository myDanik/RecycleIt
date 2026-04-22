from fastapi import APIRouter, Depends
from fastapi.responses import Response, PlainTextResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import Point


router = APIRouter()

BASE_URL = "https://recycle-it.ru"


@router.get("/sitemap.xml", response_class=Response)
async def sitemap(db: Session = Depends(get_db)):
    points = db.query(Point.id, Point.updated_at).all()

    urls = []

    urls.append(f"""
    <url>
        <loc>{BASE_URL}/sidebar/points</loc>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>
    """)

    for p in points:
        lastmod = p.updated_at.strftime("%Y-%m-%d") if p.updated_at else ""
        urls.append(f"""
        <url>
            <loc>{BASE_URL}/sidebar/points/{p.id}</loc>
            <lastmod>{lastmod}</lastmod>
            <priority>1.0</priority>
        </url>
        """)

    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    {''.join(urls)}
    </urlset>
    """

    return Response(content=xml, media_type="application/xml")


@router.get("/robots.txt", response_class=PlainTextResponse)
async def robots():
    return """User-agent: *
    Allow: /

    Disallow: /sidebar/login
    Disallow: /sidebar/admin
    Disallow: /sidebar/point/
    Disallow: /sidebar/feedback/

    Sitemap: https://recycle-it.ru/sitemap.xml
    """