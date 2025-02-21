// Create a file debug-paytm.js
import https from 'https';
import PaytmChecksum from 'paytmchecksum';
import dotenv from 'dotenv';

// Load environment variables using absolute path
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Verify environment variables are loaded
if (!process.env.PAYTM_MID || !process.env.PAYTM_MERCHANT_KEY) {
  console.error('Error: Required Paytm environment variables not found!');
  console.error('Please ensure .env file exists in backend directory with:');
  console.error('PAYTM_MID, PAYTM_MERCHANT_KEY, PAYTM_WEBSITE, PAYTM_CALLBACK_URL');
  process.exit(1);
}



// Display environment configuration with security
console.log('\n=== Paytm Environment Configuration ===');
console.log('PAYTM_MID:', process.env.PAYTM_MID);
console.log('PAYTM_MERCHANT_KEY:', process.env.PAYTM_MERCHANT_KEY ? '✓ Set' : '✗ Not Set');
console.log('PAYTM_WEBSITE:', process.env.PAYTM_WEBSITE);
console.log('PAYTM_CALLBACK_URL:', process.env.PAYTM_CALLBACK_URL);
console.log('Environment:', process.env.NODE_ENV || 'development');


console.log('PAYTM_MID:', process.env.PAYTM_MID);
console.log('PAYTM_MERCHANT_KEY:', process.env.PAYTM_MERCHANT_KEY ? '✓ Set' : '✗ Not Set');
console.log('PAYTM_WEBSITE:', process.env.PAYTM_WEBSITE);
console.log('PAYTM_CALLBACK_URL:', process.env.PAYTM_CALLBACK_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Test parameters with more descriptive format
const testOrderId = `TEST_ORDER_${Date.now()}`;

const testAmount = '1.00';

async function testPaytmIntegration() {
    try {
        console.log('\n=== Testing Paytm Integration ===');
        console.log('Test Order ID:', testOrderId);
        console.log('Test Amount:', testAmount);
        console.log('Environment:', process.env.NODE_ENV || 'development');

        
        // Prepare parameters
        const paytmParams = {
            body: {
                requestType: "Payment",
                mid: process.env.PAYTM_MID,
                websiteName: process.env.PAYTM_WEBSITE,
                orderId: testOrderId,
                callbackUrl: process.env.PAYTM_CALLBACK_URL,
                txnAmount: {
                    value: testAmount,
                    currency: "INR",
                },
                userInfo: {
                    custId: "TEST_CUSTOMER",
                    email: "test@example.com",
                    mobile: "9876543210"
                },
            }
        };

        // Generate checksum
        console.log('\nGenerating checksum...');
        console.log('Using Merchant Key:', process.env.PAYTM_MERCHANT_KEY ? '✓ Set' : '✗ Not Set');

        const checksum = await PaytmChecksum.generateSignature(
            JSON.stringify(paytmParams.body),
            process.env.PAYTM_MERCHANT_KEY
        );
        console.log('Checksum generation:', checksum ? 'Success' : 'Failed');

        paytmParams.head = {
            signature: checksum
        };

        // Set test environment
        const isProduction = process.env.NODE_ENV === 'production';
        const hostname = isProduction ? 'securegw.paytm.in' : 'securegw-stage.paytm.in';
        const path = `/theia/api/v1/initiateTransaction?mid=${process.env.PAYTM_MID}&orderId=${testOrderId}`;
        
        console.log('\nMaking API request to:');
        console.log(`https://${hostname}${path}`);

        const post_data = JSON.stringify(paytmParams);
        
        // Make API call
        console.log('\nSending request...');
        const response = await new Promise((resolve, reject) => {
            const options = {
                hostname: hostname,
                port: 443,
                path: path,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': post_data.length
                }
            };

            const req = https.request(options, (response) => {
                let data = '';
                response.on('data', (chunk) => {
                    data += chunk;
                });
                response.on('end', () => {
                    try {
                        const parsedData = JSON.parse(data);
                        resolve(parsedData);
                    } catch (e) {
                        reject(new Error(`Failed to parse response: ${data}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.write(post_data);
            req.end();
        });

        console.log('\nPaytm API Response:');
        console.log(JSON.stringify(response, null, 2));
        
        if (response.body && response.body.txnToken) {
            console.log('\n✅ TEST SUCCESSFUL: Received transaction token');
            console.log('Transaction Token:', response.body.txnToken);
        } else {
            console.log('\n❌ TEST FAILED: No transaction token received');
            console.log('Error Code:', response.body?.resultInfo?.resultCode);
            console.log('Error Message:', response.body?.resultInfo?.resultMsg);
            
            // Provide guidance based on error codes
            if (response.body?.resultInfo?.resultCode === '00000900') {
                console.log('\nPossible causes for System Error (00000900):');
                console.log('1. Incorrect Merchant ID (MID)');
                console.log('2. Incorrect Merchant Key');
                console.log('3. Website name mismatch (should match what\'s registered with Paytm)');
                console.log('4. Callback URL not properly configured or whitelisted');
            }
        }
        
    } catch (error) {
        console.error('Test failed with error:', error);
    }
}

// Run the test
testPaytmIntegration();

// How to run: 
// 1. Save this as debug-paytm.js
// 2. Run with: node debug-paytm.js
