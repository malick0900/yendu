#!/usr/bin/env python3
"""
Teranga Stay Backend API Test Suite
Tests all backend endpoints with proper authentication
"""
import requests
import sys
from datetime import datetime, timedelta

BASE_URL = "https://teranga-stay.preview.emergentagent.com/api"

class TerangaStayTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.admin_token = None
        self.traveler_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
    def log(self, message, level="INFO"):
        """Log test messages"""
        print(f"[{level}] {message}")
    
    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        self.log(f"Testing {name}...", "TEST")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, params=params, timeout=10)
            else:
                self.log(f"Unknown method {method}", "ERROR")
                return False, {}
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ PASSED - Status: {response.status_code}", "PASS")
            else:
                self.log(f"❌ FAILED - Expected {expected_status}, got {response.status_code}", "FAIL")
                self.log(f"   Response: {response.text[:200]}", "FAIL")
                self.failed_tests.append({
                    "name": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
            
            try:
                return success, response.json() if response.text else {}
            except:
                return success, {}
                
        except Exception as e:
            self.log(f"❌ FAILED - Error: {str(e)}", "ERROR")
            self.failed_tests.append({
                "name": name,
                "error": str(e)
            })
            return False, {}
    
    def get_auth_headers(self, token):
        """Get authorization headers"""
        return {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }
    
    # ========== AUTH TESTS ==========
    def test_auth(self):
        """Test authentication endpoints"""
        self.log("\n========== TESTING AUTH ==========", "SECTION")
        
        # Test admin login
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@terangastay.sn", "password": "Admin123!"}
        )
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            self.log(f"Admin token obtained: {self.admin_token[:20]}...", "INFO")
            if response.get('user', {}).get('role') != 'ADMIN':
                self.log("❌ Admin role not set correctly", "FAIL")
                self.failed_tests.append({"name": "Admin role check", "issue": "Role is not ADMIN"})
        else:
            self.log("❌ Failed to get admin token", "ERROR")
            return False
        
        # Test traveler login
        success, response = self.run_test(
            "Traveler Login",
            "POST",
            "auth/login",
            200,
            data={"email": "traveler@example.com", "password": "Traveler123!"}
        )
        if success and 'access_token' in response:
            self.traveler_token = response['access_token']
            self.log(f"Traveler token obtained: {self.traveler_token[:20]}...", "INFO")
            if response.get('user', {}).get('role') != 'TRAVELER':
                self.log("❌ Traveler role not set correctly", "FAIL")
                self.failed_tests.append({"name": "Traveler role check", "issue": "Role is not TRAVELER"})
        else:
            self.log("❌ Failed to get traveler token", "ERROR")
            return False
        
        # Test /auth/me with admin token
        self.run_test(
            "GET /auth/me (admin)",
            "GET",
            "auth/me",
            200,
            headers=self.get_auth_headers(self.admin_token)
        )
        
        # Test /auth/me with traveler token
        self.run_test(
            "GET /auth/me (traveler)",
            "GET",
            "auth/me",
            200,
            headers=self.get_auth_headers(self.traveler_token)
        )
        
        # Test register new user
        test_email = f"test_{datetime.now().strftime('%H%M%S')}@example.com"
        success, response = self.run_test(
            "Register new user",
            "POST",
            "auth/register",
            200,
            data={
                "email": test_email,
                "name": "Test User",
                "password": "Test123!"
            }
        )
        if success and response.get('user', {}).get('role') != 'TRAVELER':
            self.log("❌ New user should have TRAVELER role", "FAIL")
            self.failed_tests.append({"name": "Register role check", "issue": "New user is not TRAVELER"})
        
        return True
    
    # ========== CONTENT TESTS ==========
    def test_destinations(self):
        """Test destination endpoints"""
        self.log("\n========== TESTING DESTINATIONS ==========", "SECTION")
        
        # Get all destinations
        success, response = self.run_test(
            "GET /destinations",
            "GET",
            "destinations",
            200
        )
        if success:
            dest_count = len(response)
            self.log(f"Found {dest_count} destinations", "INFO")
            if dest_count != 4:
                self.log(f"❌ Expected 4 destinations, got {dest_count}", "FAIL")
                self.failed_tests.append({"name": "Destination count", "expected": 4, "actual": dest_count})
            
            # Test get destination by slug
            if dest_count > 0 and 'slug' in response[0]:
                slug = response[0]['slug']
                self.run_test(
                    f"GET /destinations/{slug}",
                    "GET",
                    f"destinations/{slug}",
                    200
                )
    
    def test_properties(self):
        """Test property endpoints"""
        self.log("\n========== TESTING PROPERTIES ==========", "SECTION")
        
        # Get all properties
        success, response = self.run_test(
            "GET /properties",
            "GET",
            "properties",
            200
        )
        properties = response if success else []
        self.log(f"Found {len(properties)} properties", "INFO")
        
        # Test filters
        self.run_test(
            "GET /properties?destination=dakar",
            "GET",
            "properties",
            200,
            params={"destination": "dakar"}
        )
        
        self.run_test(
            "GET /properties?type=villa",
            "GET",
            "properties",
            200,
            params={"type": "villa"}
        )
        
        self.run_test(
            "GET /properties?min_price=50000&max_price=150000",
            "GET",
            "properties",
            200,
            params={"min_price": 50000, "max_price": 150000}
        )
        
        self.run_test(
            "GET /properties?guests=4",
            "GET",
            "properties",
            200,
            params={"guests": 4}
        )
        
        self.run_test(
            "GET /properties?amenities=WiFi,Piscine",
            "GET",
            "properties",
            200,
            params={"amenities": "WiFi,Piscine"}
        )
        
        self.run_test(
            "GET /properties?sort=price_asc",
            "GET",
            "properties",
            200,
            params={"sort": "price_asc"}
        )
        
        self.run_test(
            "GET /properties?sort=price_desc",
            "GET",
            "properties",
            200,
            params={"sort": "price_desc"}
        )
        
        # Test get property by ID
        if properties and 'id' in properties[0]:
            prop_id = properties[0]['id']
            self.run_test(
                f"GET /properties/{prop_id}",
                "GET",
                f"properties/{prop_id}",
                200
            )
        
        return properties
    
    def test_experiences(self):
        """Test experience endpoints"""
        self.log("\n========== TESTING EXPERIENCES ==========", "SECTION")
        
        # Get all experiences
        success, response = self.run_test(
            "GET /experiences",
            "GET",
            "experiences",
            200
        )
        experiences = response if success else []
        self.log(f"Found {len(experiences)} experiences", "INFO")
        
        # Test filters
        self.run_test(
            "GET /experiences?category=culture",
            "GET",
            "experiences",
            200,
            params={"category": "culture"}
        )
        
        self.run_test(
            "GET /experiences?destination=dakar",
            "GET",
            "experiences",
            200,
            params={"destination": "dakar"}
        )
        
        self.run_test(
            "GET /experiences?sort=price_asc",
            "GET",
            "experiences",
            200,
            params={"sort": "price_asc"}
        )
        
        # Test get experience by ID
        if experiences and 'id' in experiences[0]:
            exp_id = experiences[0]['id']
            self.run_test(
                f"GET /experiences/{exp_id}",
                "GET",
                f"experiences/{exp_id}",
                200
            )
        
        return experiences
    
    # ========== BOOKING TESTS ==========
    def test_bookings(self, properties, experiences):
        """Test booking endpoints"""
        self.log("\n========== TESTING BOOKINGS ==========", "SECTION")
        
        booking_id = None
        
        # Create property booking (as traveler)
        if properties and 'id' in properties[0]:
            prop_id = properties[0]['id']
            check_in = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
            check_out = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
            
            success, response = self.run_test(
                "POST /bookings (property)",
                "POST",
                "bookings",
                200,
                data={
                    "type": "property",
                    "target_id": prop_id,
                    "check_in": check_in,
                    "check_out": check_out,
                    "guests": 2,
                    "notes": "Test booking"
                },
                headers=self.get_auth_headers(self.traveler_token)
            )
            
            if success:
                booking_id = response.get('id')
                # Verify price calculation
                nights = 3
                expected_total = properties[0].get('price_per_night', 0) * nights
                actual_total = response.get('total_price', 0)
                if expected_total != actual_total:
                    self.log(f"❌ Price calculation error: expected {expected_total}, got {actual_total}", "FAIL")
                    self.failed_tests.append({
                        "name": "Booking price calculation",
                        "expected": expected_total,
                        "actual": actual_total
                    })
        
        # Create experience booking (as traveler)
        if experiences and 'id' in experiences[0]:
            exp_id = experiences[0]['id']
            exp_date = (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d")
            
            success, response = self.run_test(
                "POST /bookings (experience)",
                "POST",
                "bookings",
                200,
                data={
                    "type": "experience",
                    "target_id": exp_id,
                    "experience_date": exp_date,
                    "participants": 2,
                    "notes": "Test experience booking"
                },
                headers=self.get_auth_headers(self.traveler_token)
            )
            
            if success:
                # Verify price calculation
                expected_total = experiences[0].get('price', 0) * 2
                actual_total = response.get('total_price', 0)
                if expected_total != actual_total:
                    self.log(f"❌ Experience price calculation error: expected {expected_total}, got {actual_total}", "FAIL")
                    self.failed_tests.append({
                        "name": "Experience booking price calculation",
                        "expected": expected_total,
                        "actual": actual_total
                    })
        
        # Get my bookings (as traveler)
        self.run_test(
            "GET /bookings/me",
            "GET",
            "bookings/me",
            200,
            headers=self.get_auth_headers(self.traveler_token)
        )
        
        # Admin: Get all bookings
        success, response = self.run_test(
            "GET /admin/bookings",
            "GET",
            "admin/bookings",
            200,
            headers=self.get_auth_headers(self.admin_token)
        )
        
        # Admin: Update booking status
        if booking_id:
            self.run_test(
                "PATCH /admin/bookings/:id (confirm)",
                "PATCH",
                f"admin/bookings/{booking_id}",
                200,
                data={"status": "confirmed"},
                headers=self.get_auth_headers(self.admin_token)
            )
            
            self.run_test(
                "PATCH /admin/bookings/:id (mark paid)",
                "PATCH",
                f"admin/bookings/{booking_id}",
                200,
                data={"payment_status": "paid"},
                headers=self.get_auth_headers(self.admin_token)
            )
        
        return booking_id
    
    # ========== ADMIN TESTS ==========
    def test_admin_crud(self):
        """Test admin CRUD operations"""
        self.log("\n========== TESTING ADMIN CRUD ==========", "SECTION")
        
        # Create property
        success, response = self.run_test(
            "POST /admin/properties",
            "POST",
            "admin/properties",
            200,
            data={
                "title": "Test Property",
                "description": "Test description",
                "destination_slug": "dakar",
                "city": "Dakar",
                "address": "Test Address",
                "lat": 14.7167,
                "lng": -17.4677,
                "type": "apartment",
                "price_per_night": 50000,
                "max_guests": 2,
                "bedrooms": 1,
                "beds": 1,
                "bathrooms": 1,
                "amenities": ["WiFi", "Climatisation"],
                "images": ["https://example.com/image.jpg"],
                "is_premium": False,
                "is_published": True
            },
            headers=self.get_auth_headers(self.admin_token)
        )
        
        created_prop_id = response.get('id') if success else None
        
        # Update property
        if created_prop_id:
            self.run_test(
                "PATCH /admin/properties/:id",
                "PATCH",
                f"admin/properties/{created_prop_id}",
                200,
                data={"title": "Updated Test Property", "price_per_night": 60000},
                headers=self.get_auth_headers(self.admin_token)
            )
        
        # Create experience
        success, response = self.run_test(
            "POST /admin/experiences",
            "POST",
            "admin/experiences",
            200,
            data={
                "title": "Test Experience",
                "description": "Test experience description",
                "destination_slug": "dakar",
                "city": "Dakar",
                "lat": 14.7167,
                "lng": -17.4677,
                "category": "culture",
                "duration_hours": 3.0,
                "price": 25000,
                "max_participants": 10,
                "included": ["Guide", "Transport"],
                "meeting_point": "Test location",
                "host_name": "Test Host",
                "host_bio": "Test bio",
                "host_avatar": "https://example.com/avatar.jpg",
                "images": ["https://example.com/exp.jpg"],
                "is_trending": False,
                "is_published": True
            },
            headers=self.get_auth_headers(self.admin_token)
        )
        
        created_exp_id = response.get('id') if success else None
        
        # Update experience
        if created_exp_id:
            self.run_test(
                "PATCH /admin/experiences/:id",
                "PATCH",
                f"admin/experiences/{created_exp_id}",
                200,
                data={"title": "Updated Test Experience", "price": 30000},
                headers=self.get_auth_headers(self.admin_token)
            )
        
        # Delete property
        if created_prop_id:
            self.run_test(
                "DELETE /admin/properties/:id",
                "DELETE",
                f"admin/properties/{created_prop_id}",
                200,
                headers=self.get_auth_headers(self.admin_token)
            )
        
        # Delete experience
        if created_exp_id:
            self.run_test(
                "DELETE /admin/experiences/:id",
                "DELETE",
                f"admin/experiences/{created_exp_id}",
                200,
                headers=self.get_auth_headers(self.admin_token)
            )
    
    def test_admin_stats(self):
        """Test admin stats endpoint"""
        self.log("\n========== TESTING ADMIN STATS ==========", "SECTION")
        
        success, response = self.run_test(
            "GET /admin/stats",
            "GET",
            "admin/stats",
            200,
            headers=self.get_auth_headers(self.admin_token)
        )
        
        if success:
            required_fields = ['revenue', 'total_bookings', 'chart_data', 'top_destinations']
            for field in required_fields:
                if field not in response:
                    self.log(f"❌ Missing field in stats: {field}", "FAIL")
                    self.failed_tests.append({"name": "Admin stats fields", "missing": field})
        
        # Get users
        self.run_test(
            "GET /admin/users",
            "GET",
            "admin/users",
            200,
            headers=self.get_auth_headers(self.admin_token)
        )
    
    # ========== REVIEWS TESTS ==========
    def test_reviews(self, properties):
        """Test review endpoints"""
        self.log("\n========== TESTING REVIEWS ==========", "SECTION")
        
        review_id = None
        
        # Create review (as traveler)
        if properties and 'id' in properties[0]:
            prop_id = properties[0]['id']
            success, response = self.run_test(
                "POST /reviews",
                "POST",
                "reviews",
                200,
                data={
                    "type": "property",
                    "target_id": prop_id,
                    "rating": 5,
                    "comment": "Excellent séjour!"
                },
                headers=self.get_auth_headers(self.traveler_token)
            )
            
            if success:
                review_id = response.get('id')
            
            # Get reviews for property
            self.run_test(
                "GET /reviews?type=property&target_id=...",
                "GET",
                "reviews",
                200,
                params={"type": "property", "target_id": prop_id}
            )
        
        # Admin: Get all reviews
        self.run_test(
            "GET /admin/reviews",
            "GET",
            "admin/reviews",
            200,
            headers=self.get_auth_headers(self.admin_token)
        )
    
    # ========== FAVORITES TESTS ==========
    def test_favorites(self, properties, experiences):
        """Test favorites endpoints"""
        self.log("\n========== TESTING FAVORITES ==========", "SECTION")
        
        # Add property to favorites
        if properties and 'id' in properties[0]:
            prop_id = properties[0]['id']
            self.run_test(
                "POST /favorites (property)",
                "POST",
                "favorites",
                200,
                data={
                    "type": "property",
                    "target_id": prop_id
                },
                headers=self.get_auth_headers(self.traveler_token)
            )
        
        # Add experience to favorites
        if experiences and 'id' in experiences[0]:
            exp_id = experiences[0]['id']
            self.run_test(
                "POST /favorites (experience)",
                "POST",
                "favorites",
                200,
                data={
                    "type": "experience",
                    "target_id": exp_id
                },
                headers=self.get_auth_headers(self.traveler_token)
            )
        
        # Get my favorites
        self.run_test(
            "GET /favorites/me",
            "GET",
            "favorites/me",
            200,
            headers=self.get_auth_headers(self.traveler_token)
        )
        
        # Remove favorite
        if properties and 'id' in properties[0]:
            prop_id = properties[0]['id']
            self.run_test(
                "DELETE /favorites",
                "DELETE",
                "favorites",
                200,
                params={"type": "property", "target_id": prop_id},
                headers=self.get_auth_headers(self.traveler_token)
            )
    
    # ========== SECURITY TESTS ==========
    def test_security(self):
        """Test security and authorization"""
        self.log("\n========== TESTING SECURITY ==========", "SECTION")
        
        # Traveler should not access admin endpoints
        self.run_test(
            "GET /admin/stats (as traveler - should fail)",
            "GET",
            "admin/stats",
            403,
            headers=self.get_auth_headers(self.traveler_token)
        )
        
        self.run_test(
            "GET /admin/bookings (as traveler - should fail)",
            "GET",
            "admin/bookings",
            403,
            headers=self.get_auth_headers(self.traveler_token)
        )
        
        self.run_test(
            "GET /admin/users (as traveler - should fail)",
            "GET",
            "admin/users",
            403,
            headers=self.get_auth_headers(self.traveler_token)
        )
    
    # ========== RUN ALL TESTS ==========
    def run_all_tests(self):
        """Run all test suites"""
        self.log("\n" + "="*60, "SECTION")
        self.log("TERANGA STAY BACKEND API TEST SUITE", "SECTION")
        self.log("="*60 + "\n", "SECTION")
        
        # Test auth first
        if not self.test_auth():
            self.log("\n❌ Auth tests failed - cannot continue", "ERROR")
            return False
        
        # Test content endpoints
        self.test_destinations()
        properties = self.test_properties()
        experiences = self.test_experiences()
        
        # Test bookings
        self.test_bookings(properties, experiences)
        
        # Test admin CRUD
        self.test_admin_crud()
        self.test_admin_stats()
        
        # Test reviews and favorites
        self.test_reviews(properties)
        self.test_favorites(properties, experiences)
        
        # Test security
        self.test_security()
        
        # Print summary
        self.print_summary()
        
        return self.tests_passed == self.tests_run
    
    def print_summary(self):
        """Print test summary"""
        self.log("\n" + "="*60, "SECTION")
        self.log("TEST SUMMARY", "SECTION")
        self.log("="*60, "SECTION")
        self.log(f"Total tests: {self.tests_run}", "INFO")
        self.log(f"Passed: {self.tests_passed}", "INFO")
        self.log(f"Failed: {self.tests_run - self.tests_passed}", "INFO")
        self.log(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%", "INFO")
        
        if self.failed_tests:
            self.log("\n❌ FAILED TESTS:", "FAIL")
            for i, test in enumerate(self.failed_tests, 1):
                self.log(f"{i}. {test.get('name', 'Unknown')}", "FAIL")
                if 'expected' in test:
                    self.log(f"   Expected: {test['expected']}, Got: {test['actual']}", "FAIL")
                if 'error' in test:
                    self.log(f"   Error: {test['error']}", "FAIL")
                if 'issue' in test:
                    self.log(f"   Issue: {test['issue']}", "FAIL")
        
        self.log("="*60 + "\n", "SECTION")

def main():
    tester = TerangaStayTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
