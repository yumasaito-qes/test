// test
const AWS = require('aws-sdk');
const https = require('https');
const axios = require('axios');

// ❌ 脆弱性: ハードコードされたAWS認証情報
const awsConfig = {
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  region: 'ap-northeast-1'
};

// ❌ 脆弱性: SSL証明書の検証をグローバルに無効化
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const dynamo = new AWS.DynamoDB.DocumentClient(awsConfig);

exports.handler = async (event) => {
  // ❌ 脆弱性: ハードコードされた秘密鍵
  const ADMIN_PASSWORD = "SuperSecret123!";
  
  try {
    const body = JSON.parse(event.body);
    
    // ❌ 脆弱性: 機密情報（パスワード・クレカ）をログ出力
    console.log("Debug Data:", body);

    const params = {
      TableName: "VulnerableUserTable",
      Item: {
        userId: body.userId,
        password: body.password, // ❌ 平文保存
        creditCard: body.creditCard,
        ssn: body.ssn
      }
    };

    await dynamo.put(params).promise();

    // ❌ 脆弱性: SSL検証をスキップした外部通信
    const insecureAgent = new https.Agent({ rejectUnauthorized: false });
    await axios.get('https://external-api.com', { httpsAgent: insecureAgent });

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" }, // ❌ 過剰なCORS
      body: JSON.stringify({ message: "Success" })
    };

  } catch (error) {
    // ❌ 脆弱性: スタックトレースと内部パスワードの露出
    return {
      statusCode: 500,
      body: JSON.stringify({
        stack: error.stack,
        internalDebug: ADMIN_PASSWORD
      })
    };
  }
};