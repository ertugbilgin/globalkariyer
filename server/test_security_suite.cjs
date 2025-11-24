const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const http = require('http');

const API_URL = 'http://localhost:5001/analyze';

// Helper to send request
function sendRequest(formData, description) {
    return new Promise((resolve) => {
        const options = {
            method: 'POST',
            host: 'localhost',
            port: 5001,
            path: '/analyze',
            headers: formData.getHeaders(),
        };

        const start = Date.now();
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const duration = Date.now() - start;
                resolve({ status: res.statusCode, data, duration, description });
            });
        });

        req.on('error', (e) => {
            resolve({ status: 'ERROR', data: e.message, description });
        });

        formData.pipe(req);
    });
}

async function runTests() {
    console.log("🛡️ SECURITY & QA TEST SUITE STARTED\n");

    // Test 1: Large File Upload (Memory Exhaustion Check)
    console.log("🧪 Test 1: Large File Upload (10MB Dummy File)...");
    const largeFilePath = path.join(__dirname, 'large_test.txt');
    const largeContent = "A".repeat(10 * 1024 * 1024); // 10MB
    fs.writeFileSync(largeFilePath, largeContent);

    const form1 = new FormData();
    form1.append('cv', fs.createReadStream(largeFilePath));
    const res1 = await sendRequest(form1, "Large File Upload");
    console.log(`   Result: Status ${res1.status} (${res1.duration}ms)`);
    if (res1.status === 200) console.log("   ⚠️ WARNING: Server accepted 10MB file without rejection.");
    else console.log("   ✅ Server rejected/handled large file.");
    fs.unlinkSync(largeFilePath);

    // Test 2: Rapid Requests (Rate Limit Check)
    console.log("\n🧪 Test 2: Rate Limiting (10 requests in parallel)...");
    const promises = [];
    for (let i = 0; i < 10; i++) {
        const form = new FormData();
        form.append('cv', Buffer.from("Test CV content"), { filename: 'test.txt', contentType: 'text/plain' });
        promises.push(sendRequest(form, `Req ${i}`));
    }
    const results2 = await Promise.all(promises);
    const successCount = results2.filter(r => r.status === 200).length;
    console.log(`   Result: ${successCount}/10 requests succeeded.`);
    if (successCount === 10) console.log("   ⚠️ WARNING: No rate limiting detected.");

    // Test 3: Malformed Input (No File)
    console.log("\n🧪 Test 3: Malformed Input (No File)...");
    const form3 = new FormData();
    form3.append('jobDescription', 'Software Engineer');
    const res3 = await sendRequest(form3, "No File");
    console.log(`   Result: Status ${res3.status} - ${res3.data}`);
    if (res3.status === 400) console.log("   ✅ Server correctly handled missing file.");
    else console.log("   ❌ Server failed to handle missing file.");

    // Test 4: Unsupported File Type (EXE)
    console.log("\n🧪 Test 4: Unsupported File Type (.exe)...");
    const form4 = new FormData();
    form4.append('cv', Buffer.from("MZ..."), { filename: 'malware.exe', contentType: 'application/x-msdownload' });
    const res4 = await sendRequest(form4, "EXE File");
    console.log(`   Result: Status ${res4.status} - ${res4.data}`);

    // Test 5: Performance & Average Duration (Valid Requests)
    console.log("\n🧪 Test 5: Performance Analysis (3 Valid Requests)...");
    const perfPromises = [];
    // Create a dummy valid CV content
    const validCvPath = path.join(__dirname, 'valid_cv.txt');
    fs.writeFileSync(validCvPath, "Ad: Test User\nDeneyim: Yazılım Mühendisi\nEğitim: Bilgisayar Mühendisliği");

    for (let i = 0; i < 3; i++) {
        const form = new FormData();
        form.append('cv', fs.createReadStream(validCvPath));
        form.append('jobDescription', 'Software Engineer');
        perfPromises.push(sendRequest(form, `Perf Req ${i}`));
    }

    const perfResults = await Promise.all(perfPromises);
    const validResults = perfResults.filter(r => r.status === 200);
    const avgDuration = validResults.reduce((acc, r) => acc + r.duration, 0) / (validResults.length || 1);

    console.log(`   ✅ Average Analysis Duration: ${avgDuration.toFixed(2)}ms`);
    fs.unlinkSync(validCvPath);

    // Test 6: Empty File (0 Bytes)
    console.log("\n🧪 Test 6: Empty File (0 Bytes)...");
    const emptyPath = path.join(__dirname, 'empty.txt');
    fs.writeFileSync(emptyPath, "");
    const form6 = new FormData();
    form6.append('cv', fs.createReadStream(emptyPath));
    const res6 = await sendRequest(form6, "Empty File");
    console.log(`   Result: Status ${res6.status} - ${res6.data}`);
    fs.unlinkSync(emptyPath);

    // Test 7: Special Characters / Encoding
    console.log("\n🧪 Test 7: Special Characters (Emojis/Chinese)...");
    const specialPath = path.join(__dirname, 'special.txt');
    fs.writeFileSync(specialPath, "Name: 🚀 User 👨‍💻\nSkill: Python 🐍\nLanguage: 中文");
    const form7 = new FormData();
    form7.append('cv', fs.createReadStream(specialPath));
    const res7 = await sendRequest(form7, "Special Chars");
    console.log(`   Result: Status ${res7.status}`);
    if (res7.status === 200) console.log("   ✅ Server handled special characters.");
    else console.log("   ⚠️ Server rejected special characters.");
    fs.unlinkSync(specialPath);

    console.log("\n🏁 TESTS COMPLETED");
}

runTests();
