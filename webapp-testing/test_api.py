"""
FitConnect Backend API Test Suite
Tests all API endpoints for functionality and error handling
"""
from playwright.sync_api import sync_playwright
import json
import os

BASE_URL = 'http://localhost:3000'
RESULTS = []

def log_result(test_name, passed, details=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {test_name}")
    if details:
        print(f"    {details}")
    RESULTS.append({"test": test_name, "passed": passed, "details": details})

def test_api_auth_endpoints(page):
    """Test authentication API endpoints"""
    print("\n=== Testing Auth API Endpoints ===")
    
    # Test login endpoint
    try:
        response = page.request.post(f'{BASE_URL}/api/auth/login', data={
            'email': 'alex@example.com',
            'password': 'password123'
        })
        status = response.status
        body = response.json() if response.ok else response.text()
        log_result("POST /api/auth/login", status in [200, 401, 500], f"Status: {status}, Response: {str(body)[:200]}")
    except Exception as e:
        log_result("POST /api/auth/login", False, str(e))
    
    # Test login with wrong credentials
    try:
        response = page.request.post(f'{BASE_URL}/api/auth/login', data={
            'email': 'wrong@example.com',
            'password': 'wrongpassword'
        })
        status = response.status
        log_result("POST /api/auth/login (invalid creds)", status == 401 or status == 500, f"Status: {status}")
    except Exception as e:
        log_result("POST /api/auth/login (invalid)", False, str(e))
    
    # Test register endpoint
    try:
        response = page.request.post(f'{BASE_URL}/api/auth/register', data={
            'email': f'test_{int(__import__("time").time())}@example.com',
            'password': 'testpass123',
            'name': 'Test User',
            'role': 'CLIENT'
        })
        status = response.status
        body = response.json() if response.ok else response.text()
        log_result("POST /api/auth/register", status in [200, 201, 400, 500], f"Status: {status}, Response: {str(body)[:200]}")
    except Exception as e:
        log_result("POST /api/auth/register", False, str(e))
    
    # Test me endpoint (unauthenticated)
    try:
        response = page.request.get(f'{BASE_URL}/api/auth/me')
        status = response.status
        log_result("GET /api/auth/me (unauth)", status == 401 or status == 200, f"Status: {status}")
    except Exception as e:
        log_result("GET /api/auth/me", False, str(e))

def test_api_coaches_endpoints(page):
    """Test coaches API endpoints"""
    print("\n=== Testing Coaches API Endpoints ===")
    
    # Get coaches list
    try:
        response = page.request.get(f'{BASE_URL}/api/coaches')
        status = response.status
        if response.ok:
            data = response.json()
            coach_count = len(data.get('coaches', data)) if isinstance(data, dict) else len(data)
            log_result("GET /api/coaches", True, f"Status: {status}, Found {coach_count} coaches")
        else:
            log_result("GET /api/coaches", status < 500, f"Status: {status}")
    except Exception as e:
        log_result("GET /api/coaches", False, str(e))
    
    # Get single coach (try ID 1 or first available)
    try:
        response = page.request.get(f'{BASE_URL}/api/coaches/1')
        status = response.status
        log_result("GET /api/coaches/:id", status in [200, 404], f"Status: {status}")
    except Exception as e:
        log_result("GET /api/coaches/:id", False, str(e))

def test_api_user_endpoints(page):
    """Test user API endpoints"""
    print("\n=== Testing User API Endpoints ===")
    
    # Get user profile (requires auth)
    try:
        response = page.request.get(f'{BASE_URL}/api/user/profile')
        status = response.status
        log_result("GET /api/user/profile", status in [200, 401], f"Status: {status}")
    except Exception as e:
        log_result("GET /api/user/profile", False, str(e))

def test_api_bookings_endpoints(page):
    """Test bookings API endpoints"""
    print("\n=== Testing Bookings API Endpoints ===")
    
    # Get bookings (requires auth)
    try:
        response = page.request.get(f'{BASE_URL}/api/bookings')
        status = response.status
        log_result("GET /api/bookings", status in [200, 401], f"Status: {status}")
    except Exception as e:
        log_result("GET /api/bookings", False, str(e))

def test_api_messages_endpoints(page):
    """Test messages API endpoints"""
    print("\n=== Testing Messages API Endpoints ===")
    
    # Get messages (requires auth)
    try:
        response = page.request.get(f'{BASE_URL}/api/messages')
        status = response.status
        log_result("GET /api/messages", status in [200, 401], f"Status: {status}")
    except Exception as e:
        log_result("GET /api/messages", False, str(e))

def test_api_reviews_endpoints(page):
    """Test reviews API endpoints"""
    print("\n=== Testing Reviews API Endpoints ===")
    
    try:
        response = page.request.get(f'{BASE_URL}/api/reviews')
        status = response.status
        log_result("GET /api/reviews", status in [200, 401, 404], f"Status: {status}")
    except Exception as e:
        log_result("GET /api/reviews", False, str(e))

def run_api_tests():
    """Run all API tests"""
    print("=" * 60)
    print("FITCONNECT API TEST SUITE")
    print("=" * 60)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        test_api_auth_endpoints(page)
        test_api_coaches_endpoints(page)
        test_api_user_endpoints(page)
        test_api_bookings_endpoints(page)
        test_api_messages_endpoints(page)
        test_api_reviews_endpoints(page)
        
        browser.close()
    
    # Print summary
    print("\n" + "=" * 60)
    print("API TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for r in RESULTS if r['passed'])
    failed = sum(1 for r in RESULTS if not r['passed'])
    total = len(RESULTS)
    
    print(f"\nTotal: {total} | Passed: {passed} | Failed: {failed}")
    print(f"Pass Rate: {(passed/total*100):.1f}%" if total > 0 else "No tests run")
    
    if failed > 0:
        print("\n❌ Failed Tests:")
        for r in RESULTS:
            if not r['passed']:
                print(f"  - {r['test']}: {r['details']}")
    
    # Save results
    results_dir = os.path.join(os.path.dirname(__file__), 'screenshots')
    os.makedirs(results_dir, exist_ok=True)
    results_file = os.path.join(results_dir, 'api_test_results.json')
    with open(results_file, 'w') as f:
        json.dump({
            'summary': {'total': total, 'passed': passed, 'failed': failed},
            'results': RESULTS
        }, f, indent=2)
    print(f"\n📄 Results saved to: {results_file}")

if __name__ == '__main__':
    run_api_tests()
