import pytest

pytestmark = pytest.mark.unit

VALID_JPEG = b"\xff\xd8\xff" + b"\x00" * 100
VALID_PNG  = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100


class TestUploadFile:
    def test_upload_jpeg_returns_key(self, mock_s3_client):
        from app.services.storage import upload_file
        key = upload_file(VALID_JPEG, "image/jpeg")
        assert key.startswith("points/")
        assert key.endswith(".jpg")
        mock_s3_client.put_object.assert_called_once()

    def test_upload_png_accepted(self, mock_s3_client):
        from app.services.storage import upload_file
        key = upload_file(VALID_PNG, "image/png")
        assert key is not None

    def test_upload_invalid_content_type_raises_value_error(self):
        from app.services.storage import upload_file
        with pytest.raises(ValueError, match="Недопустимый тип файла"):
            upload_file(b"data", "application/pdf")

    def test_upload_file_too_large_raises_value_error(self):
        from app.services.storage import upload_file, MAX_SIZE
        big_file = b"\x00" * (MAX_SIZE + 1)
        with pytest.raises(ValueError, match="слишком большой"):
            upload_file(big_file, "image/jpeg")

    def test_upload_exactly_max_size_accepted(self, mock_s3_client):
        from app.services.storage import upload_file, MAX_SIZE
        exactly = b"\x00" * MAX_SIZE
        upload_file(exactly, "image/jpeg")

    def test_upload_webp_accepted(self, mock_s3_client):
        from app.services.storage import upload_file
        upload_file(b"\x00" * 10, "image/webp")


class TestGetPresignedUrl:
    def test_returns_url_string(self, mock_s3_client):
        from app.services.storage import get_presigned_url
        url = get_presigned_url("points/abc.jpg")
        assert url == "https://s3.example.com/key"
        mock_s3_client.generate_presigned_url.assert_called_once_with(
            "get_object",
            Params={"Bucket": mock_s3_client.generate_presigned_url.call_args[1]["Params"]["Bucket"],
                    "Key": "points/abc.jpg"},
            ExpiresIn=3600,
        )


class TestDeleteFile:
    def test_delete_calls_s3_delete_object(self, mock_s3_client):
        from app.services.storage import delete_file
        delete_file("points/abc.jpg")
        mock_s3_client.delete_object.assert_called_once()
