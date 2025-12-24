/**
 * Ollama Connection Test Script
 * আপনার AWS Ollama server test করার জন্য
 */

const AWS_URL = "http://16.171.19.161/api/generate";
const username = "bipul";
const password = "Bipul$Ollama$Roy$2026$";

// Basic Auth token তৈরি করুন
const basicAuth = 'Basic ' + Buffer.from(username + ":" + password).toString('base64');

console.log("========================================");
console.log("  Ollama Connection Test");
console.log("========================================");
console.log("");
console.log("Server URL:", AWS_URL);
console.log("Username:", username);
console.log("Auth Token:", basicAuth);
console.log("");

// Test 1: Server availability check
async function testServerAvailability() {
    console.log("🔍 Test 1: Checking server availability...");
    try {
        const response = await fetch("http://16.171.19.161/api/tags", {
            method: 'GET',
            headers: {
                'Authorization': basicAuth
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log("✅ Server is online!");
            console.log("Available models:", data.models?.map(m => m.name).join(', ') || 'None');
            return true;
        } else {
            console.log("❌ Server responded with status:", response.status);
            const text = await response.text();
            console.log("Response:", text);
            return false;
        }
    } catch (error) {
        console.log("❌ Cannot connect to server");
        console.log("Error:", error.message);
        return false;
    }
}

// Test 2: Simple generation test
async function testGeneration() {
    console.log("\n🔍 Test 2: Testing text generation...");
    try {
        const response = await fetch(AWS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': basicAuth
            },
            body: JSON.stringify({
                model: "llama3",
                prompt: "Say hello in one word",
                stream: false
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log("✅ Generation successful!");
            console.log("Response:", data.response);
            return true;
        } else {
            console.log("❌ Generation failed with status:", response.status);
            const text = await response.text();
            console.log("Response:", text);
            return false;
        }
    } catch (error) {
        console.log("❌ Generation error");
        console.log("Error:", error.message);
        return false;
    }
}

// Test 3: Bangla prompt test
async function testBanglaPrompt() {
    console.log("\n🔍 Test 3: Testing Bangla prompt...");
    try {
        const response = await fetch(AWS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': basicAuth
            },
            body: JSON.stringify({
                model: "llama3",
                prompt: "বাংলাদেশের রাজধানী কোথায়?",
                stream: false
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log("✅ Bangla prompt successful!");
            console.log("Response:", data.response);
            return true;
        } else {
            console.log("❌ Bangla prompt failed with status:", response.status);
            const text = await response.text();
            console.log("Response:", text);
            return false;
        }
    } catch (error) {
        console.log("❌ Bangla prompt error");
        console.log("Error:", error.message);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log("Starting tests...\n");

    const test1 = await testServerAvailability();
    const test2 = await testGeneration();
    const test3 = await testBanglaPrompt();

    console.log("\n========================================");
    console.log("  Test Results");
    console.log("========================================");
    console.log("Server Availability:", test1 ? "✅ PASS" : "❌ FAIL");
    console.log("Text Generation:", test2 ? "✅ PASS" : "❌ FAIL");
    console.log("Bangla Prompt:", test3 ? "✅ PASS" : "❌ FAIL");
    console.log("");

    if (test1 && test2 && test3) {
        console.log("🎉 All tests passed! Your Ollama server is working perfectly!");
    } else {
        console.log("⚠️ Some tests failed. Please check the errors above.");
    }
}

// Run tests
runAllTests().catch(console.error);
