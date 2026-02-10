import requests
import sys
import json
from datetime import datetime, timezone

class LOTOAPITester:
    def __init__(self, base_url="https://lockout-tagout-3d.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.simulation_id = None

    def log_test(self, name, status, message="", data=None):
        """Log test results"""
        self.tests_run += 1
        status_icon = "✅" if status else "❌"
        print(f"{status_icon} {name}: {message}")
        if data:
            print(f"   Data: {json.dumps(data, indent=2)}")
        if status:
            self.tests_passed += 1
        return status

    def test_root_endpoint(self):
        """Test API root endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                return self.log_test("API Root", True, f"Status: {response.status_code}", data)
            else:
                return self.log_test("API Root", False, f"Expected 200, got {response.status_code}")
        except Exception as e:
            return self.log_test("API Root", False, f"Error: {str(e)}")

    def test_get_scenarios(self):
        """Test GET /api/scenarios"""
        try:
            response = requests.get(f"{self.api_url}/scenarios", timeout=10)
            success = response.status_code == 200
            if success:
                scenarios = response.json()
                # Check if we have the expected 3 scenarios
                expected_ids = ["gen-diesel", "compressor", "conveyor"]
                scenario_ids = [s.get("id") for s in scenarios]
                has_all_scenarios = all(sid in scenario_ids for sid in expected_ids)
                
                if has_all_scenarios and len(scenarios) == 3:
                    return self.log_test("GET Scenarios", True, f"Found {len(scenarios)} scenarios", 
                                       {"scenario_ids": scenario_ids})
                else:
                    return self.log_test("GET Scenarios", False, 
                                       f"Expected 3 scenarios with IDs {expected_ids}, got {scenario_ids}")
            else:
                return self.log_test("GET Scenarios", False, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("GET Scenarios", False, f"Error: {str(e)}")

    def test_create_simulation(self):
        """Test POST /api/simulations"""
        try:
            payload = {
                "scenario_id": "gen-diesel",
                "language": "pt"
            }
            response = requests.post(f"{self.api_url}/simulations", json=payload, timeout=10)
            success = response.status_code == 200
            if success:
                simulation = response.json()
                self.simulation_id = simulation.get("id")
                return self.log_test("Create Simulation", True, f"Created simulation: {self.simulation_id}")
            else:
                return self.log_test("Create Simulation", False, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Create Simulation", False, f"Error: {str(e)}")

    def test_update_simulation(self):
        """Test PATCH /api/simulations/:id"""
        if not self.simulation_id:
            return self.log_test("Update Simulation", False, "No simulation ID available")
        
        try:
            # Simulate some steps
            steps_performed = [
                {
                    "step_name": "power_off",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "correct": True,
                    "expected_order": 0,
                    "actual_order": 0
                },
                {
                    "step_name": "apply_lock",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "correct": False,
                    "expected_order": 2,
                    "actual_order": 1
                }
            ]
            
            payload = {
                "steps_performed": steps_performed,
                "completed": True
            }
            
            response = requests.patch(f"{self.api_url}/simulations/{self.simulation_id}", 
                                    json=payload, timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                return self.log_test("Update Simulation", True, "Simulation updated", data)
            else:
                return self.log_test("Update Simulation", False, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Update Simulation", False, f"Error: {str(e)}")

    def test_get_results(self):
        """Test GET /api/simulations/:id/results"""
        if not self.simulation_id:
            return self.log_test("Get Results", False, "No simulation ID available")
        
        try:
            response = requests.get(f"{self.api_url}/simulations/{self.simulation_id}/results", timeout=10)
            success = response.status_code == 200
            if success:
                results = response.json()
                expected_fields = ["total_steps", "correct_steps", "incorrect_steps", "score", "safety_violations"]
                has_all_fields = all(field in results for field in expected_fields)
                
                if has_all_fields:
                    return self.log_test("Get Results", True, "Results retrieved", results)
                else:
                    return self.log_test("Get Results", False, f"Missing fields in results: {results}")
            else:
                return self.log_test("Get Results", False, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Get Results", False, f"Error: {str(e)}")

    def test_invalid_simulation_id(self):
        """Test with invalid simulation ID"""
        try:
            response = requests.get(f"{self.api_url}/simulations/invalid-id/results", timeout=10)
            success = response.status_code == 404
            if success:
                return self.log_test("Invalid Simulation ID", True, "Correctly returned 404")
            else:
                return self.log_test("Invalid Simulation ID", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            return self.log_test("Invalid Simulation ID", False, f"Error: {str(e)}")

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🧪 Starting LOTO 3D API Tests")
        print("=" * 50)
        
        # Test API endpoints in order
        self.test_root_endpoint()
        self.test_get_scenarios()
        self.test_create_simulation()
        self.test_update_simulation()
        self.test_get_results()
        self.test_invalid_simulation_id()
        
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All backend tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    tester = LOTOAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())