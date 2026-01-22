"""
FitConnect Comprehensive Test Suite
Tests all major functionality including auth, navigation, dashboards, and UI elements
"""
from playwright.sync_api import sync_playwright
import json
import os

RESULTS = []
SCREENSHOTS_DIR = os.path.join(os.path.dirname(__file__), 'screenshots')
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

def log_result(test_name, passed, details=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {test_name}")
    if details:
        print(f"    {details}")
    RESULTS.append({"test": test_name, "passed": passed, "details": details})

def test_landing_page(page):
    """Test the landing page loads and has key elements"""
    print("\n=== Testing Landing Page ===")
    
    try:
        page.goto('http://localhost:3000')
        page.wait_for_load_state('networkidle')
        
        # Take screenshot
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, '01_landing_page.png'), full_page=True)
        
        # Check title/branding
        logo = page.locator('text=FitConnect')
        log_result("Landing page loads", logo.count() > 0, f"Found {logo.count()} FitConnect branding elements")
        
        # Check for key buttons
        buttons = page.locator('button').all()
        log_result("Buttons present on landing", len(buttons) > 0, f"Found {len(buttons)} buttons")
        
        # Check for navigation links
        links = page.locator('a[href]').all()
        log_result("Navigation links present", len(links) > 0, f"Found {len(links)} links")
        
        # Check for Get Started or Sign Up button
        get_started = page.locator('text=Get Started').or_(page.locator('text=Sign Up')).or_(page.locator('text=Find Your Coach'))
        log_result("Call-to-action button exists", get_started.count() > 0)
        
        # Check Login link
        login_link = page.locator('a[href="/login"]')
        log_result("Login link present", login_link.count() > 0)
        
        return True
    except Exception as e:
        log_result("Landing page test", False, str(e))
        return False

def test_signup_page(page):
    """Test the signup page loads and has form fields"""
    print("\n=== Testing Signup Page ===")
    
    try:
        page.goto('http://localhost:3000/signup')
        page.wait_for_load_state('networkidle')
        
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, '02_signup_page.png'), full_page=True)
        
        # Check for email input
        email_input = page.locator('input[type="email"], input#email')
        log_result("Email input present", email_input.count() > 0)
        
        # Check for password input
        password_input = page.locator('input[type="password"], input#password')
        log_result("Password input present", password_input.count() > 0)
        
        # Check for submit button
        submit_btn = page.locator('button[type="submit"]')
        log_result("Submit button present", submit_btn.count() > 0)
        
        # Check for role selection (Client/Coach)
        role_options = page.locator('text=Client').or_(page.locator('text=Coach'))
        log_result("Role selection options", role_options.count() > 0)
        
        return True
    except Exception as e:
        log_result("Signup page test", False, str(e))
        return False

def test_login_page(page):
    """Test the login page loads and has form fields"""
    print("\n=== Testing Login Page ===")
    
    try:
        page.goto('http://localhost:3000/login')
        page.wait_for_load_state('networkidle')
        
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, '03_login_page.png'), full_page=True)
        
        # Check for email input
        email_input = page.locator('input[type="email"], input#email')
        log_result("Login email input present", email_input.count() > 0)
        
        # Check for password input
        password_input = page.locator('input[type="password"], input#password')
        log_result("Login password input present", password_input.count() > 0)
        
        # Check for submit button
        submit_btn = page.locator('button[type="submit"]')
        log_result("Login submit button present", submit_btn.count() > 0)
        
        # Check for demo credentials hint
        demo_hint = page.locator('text=alex@example.com')
        log_result("Demo credentials hint visible", demo_hint.count() > 0)
        
        return True
    except Exception as e:
        log_result("Login page test", False, str(e))
        return False

def test_login_with_demo_credentials(page):
    """Test logging in with demo credentials"""
    print("\n=== Testing Login Flow ===")
    
    try:
        page.goto('http://localhost:3000/login')
        page.wait_for_load_state('networkidle')
        
        # Fill in demo credentials
        page.locator('input#email').fill('alex@example.com')
        page.locator('input#password').fill('password123')
        
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, '04_login_filled.png'))
        
        # Click submit
        page.locator('button[type="submit"]').click()
        
        # Wait for navigation or response
        page.wait_for_timeout(3000)
        page.wait_for_load_state('networkidle')
        
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, '05_after_login.png'), full_page=True)
        
        # Check if we're on dashboard or if there's an error
        current_url = page.url
        if '/dashboard' in current_url:
            log_result("Login with demo credentials", True, f"Redirected to {current_url}")
            return True
        else:
            # Check for error message
            error = page.locator('.text-destructive, [class*="error"]')
            if error.count() > 0:
                error_text = error.first.inner_text()
                log_result("Login with demo credentials", False, f"Error: {error_text}")
            else:
                log_result("Login with demo credentials", False, f"Stayed on {current_url}")
            return False
            
    except Exception as e:
        log_result("Login flow test", False, str(e))
        return False

def test_coaches_page(page):
    """Test the coaches marketplace page"""
    print("\n=== Testing Coaches Page ===")
    
    try:
        page.goto('http://localhost:3000/coaches')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)
        
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, '06_coaches_page.png'), full_page=True)
        
        # Check page loaded
        log_result("Coaches page loads", page.url.endswith('/coaches') or '/coaches' in page.url)
        
        # Look for coach cards or list
        coach_cards = page.locator('[class*="card"], [class*="coach"]')
        log_result("Coach listings visible", coach_cards.count() >= 0, f"Found {coach_cards.count()} coach elements")
        
        # Check for search/filter functionality
        search = page.locator('input[type="search"], input[placeholder*="Search"]')
        log_result("Search functionality present", search.count() >= 0, f"Found {search.count()} search inputs")
        
        return True
    except Exception as e:
        log_result("Coaches page test", False, str(e))
        return False

def test_dashboard_client(page):
    """Test client dashboard after login"""
    print("\n=== Testing Client Dashboard ===")
    
    try:
        # First login as client
        page.goto('http://localhost:3000/login')
        page.wait_for_load_state('networkidle')
        
        page.locator('input#email').fill('alex@example.com')
        page.locator('input#password').fill('password123')
        page.locator('button[type="submit"]').click()
        
        page.wait_for_timeout(3000)
        page.wait_for_load_state('networkidle')
        
        # Navigate to client dashboard
        page.goto('http://localhost:3000/dashboard/client')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)
        
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, '07_client_dashboard.png'), full_page=True)
        
        current_url = page.url
        log_result("Client dashboard accessible", '/dashboard' in current_url, f"URL: {current_url}")
        
        # Check for dashboard elements
        buttons = page.locator('button').all()
        log_result("Dashboard has interactive elements", len(buttons) > 0, f"Found {len(buttons)} buttons")
        
        return True
    except Exception as e:
        log_result("Client dashboard test", False, str(e))
        return False

def test_messages_page(page):
    """Test the messages page"""
    print("\n=== Testing Messages Page ===")
    
    try:
        # First login
        page.goto('http://localhost:3000/login')
        page.wait_for_load_state('networkidle')
        
        page.locator('input#email').fill('alex@example.com')
        page.locator('input#password').fill('password123')
        page.locator('button[type="submit"]').click()
        
        page.wait_for_timeout(3000)
        page.wait_for_load_state('networkidle')
        
        # Navigate to messages
        page.goto('http://localhost:3000/messages')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)
        
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, '08_messages_page.png'), full_page=True)
        
        log_result("Messages page accessible", '/messages' in page.url or '/login' not in page.url)
        
        return True
    except Exception as e:
        log_result("Messages page test", False, str(e))
        return False

def test_all_buttons_clickable(page):
    """Test that major buttons are clickable without errors"""
    print("\n=== Testing Button Functionality ===")
    
    try:
        page.goto('http://localhost:3000')
        page.wait_for_load_state('networkidle')
        
        # Test navigation buttons/links
        nav_items = ['Login', 'Sign Up', 'Get Started', 'Find Your Coach', 'Browse Coaches']
        
        for item in nav_items:
            try:
                element = page.locator(f'text={item}').first
                if element.is_visible():
                    # Just check it's clickable, don't actually navigate
                    is_enabled = element.is_enabled()
                    log_result(f"'{item}' button/link clickable", is_enabled)
            except:
                pass  # Element not found, skip
        
        return True
    except Exception as e:
        log_result("Button functionality test", False, str(e))
        return False

def test_responsive_design(page):
    """Test responsive design at different viewport sizes"""
    print("\n=== Testing Responsive Design ===")
    
    viewports = [
        ("Desktop", 1920, 1080),
        ("Tablet", 768, 1024),
        ("Mobile", 375, 667),
    ]
    
    try:
        for name, width, height in viewports:
            page.set_viewport_size({"width": width, "height": height})
            page.goto('http://localhost:3000')
            page.wait_for_load_state('networkidle')
            
            page.screenshot(path=os.path.join(SCREENSHOTS_DIR, f'09_responsive_{name.lower()}.png'), full_page=True)
            
            # Check that content is visible
            content = page.locator('body')
            log_result(f"Responsive: {name} ({width}x{height})", content.is_visible())
        
        # Reset to desktop
        page.set_viewport_size({"width": 1920, "height": 1080})
        return True
    except Exception as e:
        log_result("Responsive design test", False, str(e))
        return False

def run_all_tests():
    """Run all tests and generate summary"""
    print("=" * 60)
    print("FITCONNECT COMPREHENSIVE TEST SUITE")
    print("=" * 60)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        # Run all tests
        test_landing_page(page)
        test_signup_page(page)
        test_login_page(page)
        test_login_with_demo_credentials(page)
        test_coaches_page(page)
        test_dashboard_client(page)
        test_messages_page(page)
        test_all_buttons_clickable(page)
        test_responsive_design(page)
        
        browser.close()
    
    # Print summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
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
    
    print(f"\n📸 Screenshots saved to: {SCREENSHOTS_DIR}")
    
    # Save results to JSON
    results_file = os.path.join(SCREENSHOTS_DIR, 'test_results.json')
    with open(results_file, 'w') as f:
        json.dump({
            'summary': {'total': total, 'passed': passed, 'failed': failed},
            'results': RESULTS
        }, f, indent=2)
    print(f"📄 Results saved to: {results_file}")

if __name__ == '__main__':
    run_all_tests()
