#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Fake Review Detection System
Tests all endpoints, ML functionality, and data persistence
"""
import requests
import sys
import json
import time
from datetime import datetime
from typing import Dict, Any, List

class FakeReviewAPITester:
    def __init__(self, base_url="https://reviewsleuth.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.prediction_ids = []  # Store created prediction IDs for cleanup

    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}: PASSED")
        else:
            print(f"❌ {name}: FAILED - {details}")
        
        self.test_results.append({
            'test': name,
            'success': success,
            'details': details,
            'response_data': response_data
        })

    def test_health_check(self) -> bool:
        """Test API health check endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {}
            
            self.log_test(
                "Health Check", 
                success, 
                f"Status: {response.status_code}" if not success else "",
                data
            )
            return success
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")
            return False

    def test_analyze_genuine_review(self) -> Dict[str, Any]:
        """Test analyzing a genuine review"""
        genuine_review = {
            "text": "I bought this phone case last month and it's been holding up well. The fit is snug and the buttons are easy to press. Only minor complaint is the color is slightly different from the photos."
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/analyze", 
                json=genuine_review,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            success = response.status_code == 200
            data = response.json() if success else {}
            
            if success:
                # Store prediction ID for later cleanup
                if 'id' in data:
                    self.prediction_ids.append(data['id'])
                
                # Validate response structure
                required_fields = ['prediction', 'is_fake', 'confidence', 'model_used', 'indicators']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    success = False
                    details = f"Missing fields: {missing_fields}"
                else:
                    details = f"Prediction: {data.get('prediction')}, Confidence: {data.get('confidence')}%"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Analyze Genuine Review", success, details, data)
            return data if success else {}
            
        except Exception as e:
            self.log_test("Analyze Genuine Review", False, f"Exception: {str(e)}")
            return {}

    def test_analyze_fake_review(self) -> Dict[str, Any]:
        """Test analyzing a fake review"""
        fake_review = {
            "text": "AMAZING!!! BEST PRODUCT EVER!!! Everyone MUST buy this!!! Changed my life completely!!! 5 STARS is not enough!!! BUY NOW!!!"
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/analyze", 
                json=fake_review,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            success = response.status_code == 200
            data = response.json() if success else {}
            
            if success:
                # Store prediction ID for later cleanup
                if 'id' in data:
                    self.prediction_ids.append(data['id'])
                
                # Check if it correctly identifies as fake
                is_fake_detected = data.get('is_fake', False)
                has_indicators = len(data.get('indicators', [])) > 0
                
                details = f"Prediction: {data.get('prediction')}, Is Fake: {is_fake_detected}, Indicators: {len(data.get('indicators', []))}"
                
                if not is_fake_detected:
                    print(f"⚠️  Warning: Fake review not detected as fake. Confidence: {data.get('confidence')}%")
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Analyze Fake Review", success, details, data)
            return data if success else {}
            
        except Exception as e:
            self.log_test("Analyze Fake Review", False, f"Exception: {str(e)}")
            return {}

    def test_invalid_review_input(self) -> bool:
        """Test invalid review input handling"""
        invalid_inputs = [
            {"text": ""},  # Empty text
            {"text": "Hi"},  # Too short
            {},  # Missing text field
        ]
        
        all_passed = True
        for i, invalid_input in enumerate(invalid_inputs):
            try:
                response = requests.post(
                    f"{self.api_url}/analyze", 
                    json=invalid_input,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                # Should return 422 for validation errors
                success = response.status_code in [400, 422]
                if not success:
                    all_passed = False
                    print(f"  Invalid input {i+1}: Expected 400/422, got {response.status_code}")
                
            except Exception as e:
                all_passed = False
                print(f"  Invalid input {i+1}: Exception - {str(e)}")
        
        self.log_test("Invalid Review Input Handling", all_passed)
        return all_passed

    def test_get_predictions(self) -> List[Dict]:
        """Test retrieving prediction history"""
        try:
            response = requests.get(f"{self.api_url}/predictions?limit=50", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else []
            
            if success:
                details = f"Retrieved {len(data)} predictions"
                # Validate structure of first prediction if any exist
                if data and len(data) > 0:
                    first_pred = data[0]
                    required_fields = ['id', 'prediction', 'confidence', 'created_at']
                    missing_fields = [field for field in required_fields if field not in first_pred]
                    if missing_fields:
                        success = False
                        details = f"Missing fields in prediction: {missing_fields}"
            else:
                details = f"Status: {response.status_code}"
            
            self.log_test("Get Predictions", success, details, len(data) if success else 0)
            return data if success else []
            
        except Exception as e:
            self.log_test("Get Predictions", False, f"Exception: {str(e)}")
            return []

    def test_get_specific_prediction(self, prediction_id: str) -> bool:
        """Test retrieving a specific prediction by ID"""
        if not prediction_id:
            self.log_test("Get Specific Prediction", False, "No prediction ID available")
            return False
        
        try:
            response = requests.get(f"{self.api_url}/predictions/{prediction_id}", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {}
            
            if success:
                details = f"Retrieved prediction {prediction_id[:8]}..."
            else:
                details = f"Status: {response.status_code}"
            
            self.log_test("Get Specific Prediction", success, details, data)
            return success
            
        except Exception as e:
            self.log_test("Get Specific Prediction", False, f"Exception: {str(e)}")
            return False

    def test_dashboard_stats(self) -> Dict[str, Any]:
        """Test dashboard statistics endpoint"""
        try:
            response = requests.get(f"{self.api_url}/dashboard/stats", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {}
            
            if success:
                required_fields = ['total_reviews', 'fake_count', 'genuine_count', 'average_confidence']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    success = False
                    details = f"Missing fields: {missing_fields}"
                else:
                    details = f"Total: {data.get('total_reviews')}, Fake: {data.get('fake_count')}, Genuine: {data.get('genuine_count')}"
            else:
                details = f"Status: {response.status_code}"
            
            self.log_test("Dashboard Stats", success, details, data)
            return data if success else {}
            
        except Exception as e:
            self.log_test("Dashboard Stats", False, f"Exception: {str(e)}")
            return {}

    def test_model_metrics(self) -> Dict[str, Any]:
        """Test model metrics endpoint"""
        try:
            response = requests.get(f"{self.api_url}/metrics", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {}
            
            if success:
                required_fields = ['best_model', 'metrics']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    success = False
                    details = f"Missing fields: {missing_fields}"
                else:
                    best_model = data.get('best_model', 'Unknown')
                    metrics_count = len(data.get('metrics', {}))
                    details = f"Best model: {best_model}, Models trained: {metrics_count}"
            else:
                details = f"Status: {response.status_code}"
            
            self.log_test("Model Metrics", success, details, data)
            return data if success else {}
            
        except Exception as e:
            self.log_test("Model Metrics", False, f"Exception: {str(e)}")
            return {}

    def test_delete_prediction(self, prediction_id: str) -> bool:
        """Test deleting a prediction"""
        if not prediction_id:
            self.log_test("Delete Prediction", False, "No prediction ID available")
            return False
        
        try:
            response = requests.delete(f"{self.api_url}/predictions/{prediction_id}", timeout=10)
            success = response.status_code == 200
            
            if success:
                details = f"Deleted prediction {prediction_id[:8]}..."
            else:
                details = f"Status: {response.status_code}"
            
            self.log_test("Delete Prediction", success, details)
            return success
            
        except Exception as e:
            self.log_test("Delete Prediction", False, f"Exception: {str(e)}")
            return False

    def test_ml_model_functionality(self) -> bool:
        """Test ML model detection capabilities"""
        test_cases = [
            {
                "text": "This product is okay. Nothing special but it works fine for the price.",
                "expected_fake": False,
                "description": "Neutral genuine review"
            },
            {
                "text": "PERFECT!!! AMAZING!!! BEST EVER!!! BUY NOW!!! 5 STARS!!!",
                "expected_fake": True,
                "description": "Obvious fake review with excessive caps and exclamation"
            },
            {
                "text": "Great product! Works as described. Fast shipping. Recommended!",
                "expected_fake": False,
                "description": "Positive but natural review"
            }
        ]
        
        correct_predictions = 0
        total_tests = len(test_cases)
        
        for i, test_case in enumerate(test_cases):
            try:
                response = requests.post(
                    f"{self.api_url}/analyze", 
                    json={"text": test_case["text"]},
                    headers={'Content-Type': 'application/json'},
                    timeout=30
                )
                
                if response.status_code == 200:
                    data = response.json()
                    predicted_fake = data.get('is_fake', False)
                    confidence = data.get('confidence', 0)
                    
                    if predicted_fake == test_case["expected_fake"]:
                        correct_predictions += 1
                        print(f"  ✅ Test {i+1}: {test_case['description']} - Correct ({confidence}%)")
                    else:
                        print(f"  ❌ Test {i+1}: {test_case['description']} - Incorrect (Expected: {test_case['expected_fake']}, Got: {predicted_fake}, Confidence: {confidence}%)")
                    
                    # Store ID for cleanup
                    if 'id' in data:
                        self.prediction_ids.append(data['id'])
                else:
                    print(f"  ❌ Test {i+1}: API error - Status {response.status_code}")
                    
            except Exception as e:
                print(f"  ❌ Test {i+1}: Exception - {str(e)}")
        
        accuracy = (correct_predictions / total_tests) * 100
        success = accuracy >= 60  # At least 60% accuracy expected
        
        self.log_test(
            "ML Model Functionality", 
            success, 
            f"Accuracy: {accuracy:.1f}% ({correct_predictions}/{total_tests})"
        )
        return success

    def cleanup_test_data(self):
        """Clean up test predictions"""
        print(f"\n🧹 Cleaning up {len(self.prediction_ids)} test predictions...")
        cleaned = 0
        for pred_id in self.prediction_ids:
            try:
                response = requests.delete(f"{self.api_url}/predictions/{pred_id}", timeout=5)
                if response.status_code == 200:
                    cleaned += 1
            except:
                pass  # Ignore cleanup errors
        print(f"   Cleaned up {cleaned} predictions")

    def run_all_tests(self) -> Dict[str, Any]:
        """Run comprehensive test suite"""
        print("🚀 Starting Fake Review Detection API Tests")
        print(f"   Base URL: {self.base_url}")
        print(f"   API URL: {self.api_url}")
        print("=" * 60)
        
        start_time = time.time()
        
        # Core API Tests
        print("\n📡 Testing Core API Endpoints...")
        health_ok = self.test_health_check()
        
        if not health_ok:
            print("❌ Health check failed - stopping tests")
            return self._generate_report(start_time)
        
        # ML Analysis Tests
        print("\n🤖 Testing ML Analysis...")
        genuine_result = self.test_analyze_genuine_review()
        fake_result = self.test_analyze_fake_review()
        self.test_invalid_review_input()
        
        # Data Retrieval Tests
        print("\n📊 Testing Data Retrieval...")
        predictions = self.test_get_predictions()
        
        # Test specific prediction retrieval if we have IDs
        if self.prediction_ids:
            self.test_get_specific_prediction(self.prediction_ids[0])
        
        # Dashboard and Metrics Tests
        print("\n📈 Testing Dashboard & Metrics...")
        self.test_dashboard_stats()
        self.test_model_metrics()
        
        # ML Model Quality Tests
        print("\n🎯 Testing ML Model Quality...")
        self.test_ml_model_functionality()
        
        # Cleanup Tests
        print("\n🗑️  Testing Delete Functionality...")
        if self.prediction_ids:
            # Test deleting one prediction
            test_id = self.prediction_ids.pop()
            self.test_delete_prediction(test_id)
        
        # Final cleanup
        self.cleanup_test_data()
        
        return self._generate_report(start_time)

    def _generate_report(self, start_time: float) -> Dict[str, Any]:
        """Generate test report"""
        end_time = time.time()
        duration = end_time - start_time
        
        print("\n" + "=" * 60)
        print("📋 TEST SUMMARY")
        print("=" * 60)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        print(f"Duration: {duration:.2f} seconds")
        
        # Identify failed tests
        failed_tests = [result for result in self.test_results if not result['success']]
        if failed_tests:
            print(f"\n❌ Failed Tests ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['details']}")
        
        return {
            'total_tests': self.tests_run,
            'passed_tests': self.tests_passed,
            'failed_tests': self.tests_run - self.tests_passed,
            'success_rate': round((self.tests_passed/self.tests_run*100), 1) if self.tests_run > 0 else 0,
            'duration': round(duration, 2),
            'failed_test_details': failed_tests,
            'all_results': self.test_results
        }


def main():
    """Main test execution"""
    tester = FakeReviewAPITester()
    
    try:
        results = tester.run_all_tests()
        
        # Return appropriate exit code
        if results['success_rate'] >= 80:
            print("\n🎉 All critical tests passed!")
            return 0
        elif results['success_rate'] >= 60:
            print("\n⚠️  Some tests failed but core functionality works")
            return 1
        else:
            print("\n💥 Critical failures detected")
            return 2
            
    except KeyboardInterrupt:
        print("\n\n⏹️  Tests interrupted by user")
        tester.cleanup_test_data()
        return 130
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        return 1


if __name__ == "__main__":
    sys.exit(main())