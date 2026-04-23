import boto3, uuid, os
from botocore.config import Config
from app.config import settings


s3 = boto3.client(
    "s3",
    endpoint_url=settings.S3_ENDPOINT,
    aws_access_key_id=settings.S3_ACCESS_KEY,
    aws_secret_access_key=settings.S3_SECRET_KEY,
    config=Config(signature_version="s3v4"),
    region_name="us-east-1",
)

BUCKET = settings.S3_BUCKET

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE = 5 * 1024 * 1024

def upload_file(file_bytes: bytes, content_type: str) -> str:
    if content_type not in ALLOWED_TYPES:
        raise ValueError("Недопустимый тип файла")
    if len(file_bytes) > MAX_SIZE:
        raise ValueError("Файл слишком большой (макс. 5 МБ)")

    key = f"points/{uuid.uuid4()}.jpg"
    s3.put_object(Bucket=BUCKET, Key=key, Body=file_bytes, ContentType=content_type)
    return key

def get_presigned_url(key: str, expires: int = 3600) -> str:
    return s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": BUCKET, "Key": key},
        ExpiresIn=expires,
    )

def delete_file(key: str):
    s3.delete_object(Bucket=BUCKET, Key=key)