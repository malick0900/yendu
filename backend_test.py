"""
Teranga Stay Phase 3 - Backend API Testing
Tests all new admin enhancements: object storage, site CMS, destinations CRUD,
advanced KPIs, CSV exports, admin logs, availability blocking, notifications
"""
import requests
import sys
import io
from datetime import datetime, timedelta

BASE_URL = "https://teranga-stay.preview.emergentagent.com/api"

class TerangaPhase3Tester:
    def __init__(self):
        self.admin_token = None
        self.traveler_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_destination_id = None
        self.test_property_id = None
        self.test_file_id = None

    def log(self, msg, status="INFO"):
        prefix = "✅" if status == "PASS" else "❌" if status == "FAIL" else "🔍"
        print(f"{prefix} {msg}")

    def test(self, name, method, endpoint, expected_status, data=None, headers=None, files=None, token=None):
        """Run a single API test"""
        url = f"{BASE_URL}{endpoint}"
        h = headers or {}
        if token:
            h['Authorization'] = f'Bearer {token}'
        if data and not files:
            h['Content-Type'] = 'application/json'

        self.tests_run += 1
        self.log(f"Testing {name}...", "INFO")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=h, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, headers=h, timeout=30)
                else:
                    response = requests.post(url, json=data, headers=h, timeout=30)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=h, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=h, timeout=30)
            else:
                self.log(f"Unknown method {method}", "FAIL")
                return False, {}

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"PASS - {name} (status: {response.status_code})", "PASS")
            else:
                self.log(f"FAIL - {name} - Expected {expected_status}, got {response.status_code}", "FAIL")
                if response.text:
                    print(f"   Response: {response.text[:200]}")

            # Try to parse JSON, but handle CSV/binary responses
            result = {}
            if response.headers.get('content-type', '').startswith('application/json'):
                try:
                    result = response.json()
                except:
                    pass
            elif response.headers.get('content-type', '').startswith('text/csv'):
                result = {'csv_content': response.text[:100]}
            elif response.headers.get('content-type', '').startswith('image/'):
                result = {'binary_size': len(response.content)}
            
            return success, result

        except Exception as e:
            self.log(f"FAIL - {name} - Error: {str(e)}", "FAIL")
            return False, {}

    def run_all_tests(self):
        """Run all Phase 3 tests"""
        print("\n" + "="*70)
        print("TERANGA STAY PHASE 3 - BACKEND API TESTS")
        print("="*70 + "\n")

        # 1. Authentication
        print("\n--- AUTHENTICATION ---")
        success, resp = self.test(
            "Admin login",
            "POST",
            "/auth/login",
            200,
            data={"email": "admin@terangastay.sn", "password": "Admin123!"}
        )
        if success and 'access_token' in resp:
            self.admin_token = resp['access_token']
            self.log(f"Admin token obtained", "PASS")
        else:
            self.log("Failed to get admin token - stopping tests", "FAIL")
            return False

        success, resp = self.test(
            "Traveler login",
            "POST",
            "/auth/login",
            200,
            data={"email": "traveler@example.com", "password": "Traveler123!"}
        )
        if success and 'access_token' in resp:
            self.traveler_token = resp['access_token']

        # 2. Site Content CMS (Public)
        print("\n--- SITE CONTENT CMS (PUBLIC) ---")
        success, content = self.test(
            "GET /api/site/content (public)",
            "GET",
            "/site/content",
            200
        )
        if success:
            required_fields = ['hero_title', 'testimonials', 'faqs', 'contact_email', 'footer_tagline']
            for field in required_fields:
                if field in content:
                    self.log(f"  ✓ Field '{field}' present", "PASS")
                else:
                    self.log(f"  ✗ Field '{field}' missing", "FAIL")

        # 3. Site Content CMS (Admin Update)
        print("\n--- SITE CONTENT CMS (ADMIN UPDATE) ---")
        test_title = f"Test Hero Title - {datetime.now().strftime('%H:%M:%S')}"
        success, updated = self.test(
            "PATCH /api/admin/site/content",
            "PATCH",
            "/admin/site/content",
            200,
            data={"content": {"hero_title": test_title, "hero_badge": "Test Badge"}},
            token=self.admin_token
        )
        if success and updated.get('hero_title') == test_title:
            self.log(f"  ✓ Content updated successfully", "PASS")
        else:
            self.log(f"  ✗ Content update failed or not reflected", "FAIL")

        # 4. Object Storage - Image Upload
        print("\n--- OBJECT STORAGE - IMAGE UPLOAD ---")
        # Create a small test image (1x1 PNG)
        test_image = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
        
        success, upload_resp = self.test(
            "POST /api/admin/upload (image file)",
            "POST",
            "/admin/upload",
            200,
            files={'file': ('test.png', io.BytesIO(test_image), 'image/png')},
            token=self.admin_token
        )
        if success:
            if 'id' in upload_resp and 'url' in upload_resp:
                self.test_file_id = upload_resp['id']
                self.log(f"  ✓ Upload returned id: {self.test_file_id}", "PASS")
                self.log(f"  ✓ Upload returned url: {upload_resp['url']}", "PASS")
                if upload_resp['url'].startswith('/api/files/'):
                    self.log(f"  ✓ URL format correct (/api/files/...)", "PASS")
                else:
                    self.log(f"  ✗ URL format incorrect: {upload_resp['url']}", "FAIL")
            else:
                self.log(f"  ✗ Upload response missing id or url", "FAIL")

        # 5. Download uploaded file
        if self.test_file_id:
            print("\n--- OBJECT STORAGE - FILE DOWNLOAD ---")
            success, download_resp = self.test(
                f"GET /api/files/{self.test_file_id}",
                "GET",
                f"/files/{self.test_file_id}",
                200
            )
            if success and download_resp.get('binary_size', 0) > 0:
                self.log(f"  ✓ File downloaded, size: {download_resp['binary_size']} bytes", "PASS")

        # 6. Destinations CRUD
        print("\n--- DESTINATIONS CRUD ---")
        test_slug = f"test-dest-{datetime.now().strftime('%H%M%S')}"
        success, dest = self.test(
            "POST /api/admin/destinations",
            "POST",
            "/admin/destinations",
            200,
            data={
                "name": "Test Destination",
                "slug": test_slug,
                "tagline": "Test tagline",
                "short_description": "Short desc",
                "description": "Full description",
                "hero_image": "https://via.placeholder.com/800",
                "country": "Sénégal"
            },
            token=self.admin_token
        )
        if success and 'id' in dest:
            self.test_destination_id = dest['id']
            self.log(f"  ✓ Destination created with id: {self.test_destination_id}", "PASS")

            # Update destination
            success, _ = self.test(
                f"PATCH /api/admin/destinations/{self.test_destination_id}",
                "PATCH",
                f"/admin/destinations/{self.test_destination_id}",
                200,
                data={"name": "Updated Test Destination"},
                token=self.admin_token
            )

            # Get public destinations list
            success, dests = self.test(
                "GET /api/destinations (public)",
                "GET",
                "/destinations",
                200
            )
            if success and isinstance(dests, list):
                self.log(f"  ✓ Public destinations list returned {len(dests)} items", "PASS")

        # 7. Advanced KPIs
        print("\n--- ADVANCED KPIs ---")
        success, stats = self.test(
            "GET /api/admin/stats",
            "GET",
            "/admin/stats",
            200,
            token=self.admin_token
        )
        if success:
            new_fields = ['occupancy_rate', 'avg_stay', 'pending_revenue', 'top_properties', 'top_experiences', 'property_bookings', 'experience_bookings']
            for field in new_fields:
                if field in stats:
                    self.log(f"  ✓ KPI '{field}' present: {stats[field]}", "PASS")
                else:
                    self.log(f"  ✗ KPI '{field}' missing", "FAIL")

        # 8. CSV Exports
        print("\n--- CSV EXPORTS ---")
        success, csv_resp = self.test(
            "GET /api/admin/export/bookings.csv",
            "GET",
            "/admin/export/bookings.csv",
            200,
            token=self.admin_token
        )
        if success and 'csv_content' in csv_resp:
            self.log(f"  ✓ Bookings CSV export working", "PASS")

        success, csv_resp = self.test(
            "GET /api/admin/export/users.csv",
            "GET",
            "/admin/export/users.csv",
            200,
            token=self.admin_token
        )
        if success and 'csv_content' in csv_resp:
            self.log(f"  ✓ Users CSV export working", "PASS")

        # 9. Admin Logs
        print("\n--- ADMIN LOGS ---")
        success, logs = self.test(
            "GET /api/admin/logs",
            "GET",
            "/admin/logs",
            200,
            token=self.admin_token
        )
        if success and isinstance(logs, list):
            self.log(f"  ✓ Admin logs returned {len(logs)} entries", "PASS")
            if len(logs) > 0:
                log_entry = logs[0]
                if 'action' in log_entry and 'admin_email' in log_entry:
                    self.log(f"  ✓ Log entry has correct structure", "PASS")

        # 10. Availability Blocking
        print("\n--- AVAILABILITY BLOCKING ---")
        # Get a property first
        success, props = self.test(
            "GET /api/admin/properties",
            "GET",
            "/admin/properties",
            200,
            token=self.admin_token
        )
        if success and isinstance(props, list) and len(props) > 0:
            self.test_property_id = props[0]['id']
            self.log(f"  ✓ Using property id: {self.test_property_id}", "PASS")

            # Block dates
            today = datetime.now().date()
            start_date = (today + timedelta(days=30)).isoformat()
            end_date = (today + timedelta(days=35)).isoformat()
            
            success, block = self.test(
                f"POST /api/admin/properties/{self.test_property_id}/availability",
                "POST",
                f"/admin/properties/{self.test_property_id}/availability",
                200,
                data={
                    "property_id": self.test_property_id,
                    "start_date": start_date,
                    "end_date": end_date,
                    "reason": "Test block"
                },
                token=self.admin_token
            )
            if success and 'id' in block:
                block_id = block['id']
                self.log(f"  ✓ Availability block created: {block_id}", "PASS")

                # Get availability (admin)
                success, blocks = self.test(
                    f"GET /api/admin/properties/{self.test_property_id}/availability",
                    "GET",
                    f"/admin/properties/{self.test_property_id}/availability",
                    200,
                    token=self.admin_token
                )
                if success and isinstance(blocks, list):
                    self.log(f"  ✓ Admin availability list returned {len(blocks)} blocks", "PASS")

                # Get availability (public)
                success, public_blocks = self.test(
                    f"GET /api/properties/{self.test_property_id}/availability (public)",
                    "GET",
                    f"/properties/{self.test_property_id}/availability",
                    200
                )
                if success and isinstance(public_blocks, list):
                    self.log(f"  ✓ Public availability returned {len(public_blocks)} items", "PASS")

                # Delete block
                success, _ = self.test(
                    f"DELETE /api/admin/availability/{block_id}",
                    "DELETE",
                    f"/admin/availability/{block_id}",
                    200,
                    token=self.admin_token
                )

        # 11. Notifications
        print("\n--- NOTIFICATIONS ---")
        success, notifs = self.test(
            "GET /api/admin/notifications",
            "GET",
            "/admin/notifications",
            200,
            token=self.admin_token
        )
        if success and isinstance(notifs, list):
            self.log(f"  ✓ Notifications list returned {len(notifs)} entries", "PASS")
            # Check for booking_created notifications
            booking_notifs = [n for n in notifs if n.get('type') == 'booking_created']
            if booking_notifs:
                self.log(f"  ✓ Found {len(booking_notifs)} booking_created notifications", "PASS")
                # Check status
                if booking_notifs[0].get('status') == 'log-only':
                    self.log(f"  ✓ Notification status is 'log-only' (SMTP not configured)", "PASS")

        success, smtp_status = self.test(
            "GET /api/admin/notifications/status",
            "GET",
            "/admin/notifications/status",
            200,
            token=self.admin_token
        )
        if success:
            if 'smtp_configured' in smtp_status:
                self.log(f"  ✓ SMTP status: {smtp_status['smtp_configured']}", "PASS")
                if not smtp_status['smtp_configured']:
                    self.log(f"  ✓ SMTP correctly reported as not configured", "PASS")

        # 12. Admin-only endpoints (403 for non-admin)
        print("\n--- ADMIN AUTHORIZATION ---")
        if self.traveler_token:
            success, _ = self.test(
                "GET /api/admin/stats (traveler - should fail)",
                "GET",
                "/admin/stats",
                403,
                token=self.traveler_token
            )
            if success:
                self.log(f"  ✓ Non-admin correctly denied access to /api/admin/stats", "PASS")

            success, _ = self.test(
                "PATCH /api/admin/site/content (traveler - should fail)",
                "PATCH",
                "/admin/site/content",
                403,
                data={"content": {"hero_title": "Hacker"}},
                token=self.traveler_token
            )
            if success:
                self.log(f"  ✓ Non-admin correctly denied access to /api/admin/site/content", "PASS")

        # 13. Cleanup - Delete test destination
        if self.test_destination_id:
            print("\n--- CLEANUP ---")
            success, _ = self.test(
                f"DELETE /api/admin/destinations/{self.test_destination_id}",
                "DELETE",
                f"/admin/destinations/{self.test_destination_id}",
                200,
                token=self.admin_token
            )

        return True

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*70)
        print("TEST SUMMARY")
        print("="*70)
        print(f"Total tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"Success rate: {success_rate:.1f}%")
        print("="*70 + "\n")
        
        return 0 if self.tests_passed == self.tests_run else 1


def main():
    tester = TerangaPhase3Tester()
    try:
        tester.run_all_tests()
        return tester.print_summary()
    except KeyboardInterrupt:
        print("\n\nTests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n\nFatal error: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
