from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase


class VideoCallTokenViewTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()

        self.student = user_model.objects.create_user(
            username='student_user',
            email='student@example.com',
            password='student-pass-123',
            is_teacher=False,
            is_admin=False,
        )
        self.teacher = user_model.objects.create_user(
            username='teacher_user',
            email='teacher@example.com',
            password='teacher-pass-123',
            is_teacher=True,
            is_admin=False,
        )

        self.student_token, _ = Token.objects.get_or_create(user=self.student)
        self.teacher_token, _ = Token.objects.get_or_create(user=self.teacher)

        self.url = '/api/accounts/video-call/token/'
        self.config_url = '/api/accounts/video-call/config/'

    def _auth_as(self, token_key: str):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token_key}')

    def test_requires_authentication(self):
        response = self.client.post(self.url, {}, format='json')
        self.assertEqual(response.status_code, 401)

    def test_config_requires_authentication(self):
        response = self.client.get(self.config_url)
        self.assertEqual(response.status_code, 401)

    @override_settings(
        JAAS_APP_ID='',
        JAAS_DOMAIN='8x8.vc',
        JAAS_KID='',
        JAAS_PRIVATE_KEY='',
        JAAS_REQUIRE_AUTH_TOKEN=False,
    )
    def test_returns_503_if_jaas_app_id_missing(self):
        self._auth_as(self.student_token.key)

        response = self.client.post(self.url, {'room_name': 'class-10'}, format='json')

        self.assertEqual(response.status_code, 503)
        self.assertIn('missing JAAS_APP_ID', response.data.get('error', ''))

    @override_settings(
        JAAS_APP_ID='',
        JAAS_DOMAIN='8x8.vc',
        JAAS_KID='',
        JAAS_PRIVATE_KEY='',
        JAAS_REQUIRE_AUTH_TOKEN=False,
    )
    def test_config_reports_missing_fields(self):
        self._auth_as(self.student_token.key)

        response = self.client.get(self.config_url)

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data['token_endpoint_ready'])
        self.assertIn('JAAS_APP_ID', response.data['missing_fields'])

    @override_settings(
        JAAS_APP_ID='',
        JAAS_DOMAIN='8x8.vc',
        JAAS_KID='',
        JAAS_PRIVATE_KEY='',
        JAAS_REQUIRE_AUTH_TOKEN=False,
    )
    def test_token_accepts_request_level_app_id_fallback(self):
        self._auth_as(self.student_token.key)

        response = self.client.post(
            self.url,
            {
                'room_name': 'class-10-science',
                'display_name': 'Student One',
                'app_id': 'vpaas-magic-cookie-testappid',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['app_id'], 'vpaas-magic-cookie-testappid')
        self.assertEqual(
            response.data['room_name'],
            'vpaas-magic-cookie-testappid/class-10-science',
        )
        self.assertEqual(
            response.data['script_url'],
            'https://8x8.vc/vpaas-magic-cookie-testappid/external_api.js',
        )

    @override_settings(
        JAAS_APP_ID='',
        JAAS_DOMAIN='8x8.vc',
        JAAS_KID='',
        JAAS_PRIVATE_KEY='',
        JAAS_REQUIRE_AUTH_TOKEN=False,
    )
    def test_config_accepts_query_app_id_fallback(self):
        self._auth_as(self.student_token.key)

        response = self.client.get(
            f'{self.config_url}?app_id=vpaas-magic-cookie-testappid'
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['token_endpoint_ready'])
        self.assertEqual(response.data['app_id'], 'vpaas-magic-cookie-testappid')

    @override_settings(
        JAAS_APP_ID='vpaas-magic-cookie-testappid',
        JAAS_DOMAIN='8x8.vc',
        JAAS_KID='',
        JAAS_PRIVATE_KEY='',
        JAAS_REQUIRE_AUTH_TOKEN=False,
    )
    def test_returns_bootstrap_payload_without_jwt_when_optional(self):
        self._auth_as(self.student_token.key)

        response = self.client.post(
            self.url,
            {
                'room_name': 'Class 10 Math',
                'display_name': 'Student One',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['domain'], '8x8.vc')
        self.assertEqual(response.data['app_id'], 'vpaas-magic-cookie-testappid')
        self.assertEqual(response.data['room_slug'], 'class-10-math')
        self.assertEqual(
            response.data['room_name'],
            'vpaas-magic-cookie-testappid/class-10-math',
        )
        self.assertEqual(
            response.data['script_url'],
            'https://8x8.vc/vpaas-magic-cookie-testappid/external_api.js',
        )
        self.assertIsNone(response.data['jwt'])
        self.assertFalse(response.data['requires_jwt'])

    @override_settings(
        JAAS_APP_ID='vpaas-magic-cookie-testappid',
        JAAS_DOMAIN='8x8.vc',
        JAAS_KID='',
        JAAS_PRIVATE_KEY='',
        JAAS_REQUIRE_AUTH_TOKEN=True,
    )
    def test_blocks_if_jwt_required_but_key_material_missing(self):
        self._auth_as(self.student_token.key)

        response = self.client.post(self.url, {'room_name': 'class-11'}, format='json')

        self.assertEqual(response.status_code, 500)
        self.assertIn('JAAS_KID/JAAS_PRIVATE_KEY', response.data.get('error', ''))

    @override_settings(
        JAAS_APP_ID='vpaas-magic-cookie-testappid',
        JAAS_DOMAIN='8x8.vc',
        JAAS_KID='',
        JAAS_PRIVATE_KEY='',
        JAAS_REQUIRE_AUTH_TOKEN=False,
    )
    def test_moderator_flag_is_role_based(self):
        self._auth_as(self.student_token.key)
        student_response = self.client.post(self.url, {'room_name': 'class-9'}, format='json')

        self._auth_as(self.teacher_token.key)
        teacher_response = self.client.post(self.url, {'room_name': 'class-9'}, format='json')

        self.assertEqual(student_response.status_code, 200)
        self.assertEqual(teacher_response.status_code, 200)
        self.assertFalse(student_response.data['moderator'])
        self.assertTrue(teacher_response.data['moderator'])
