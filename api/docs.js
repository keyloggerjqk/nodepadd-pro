module.exports = (req, res) => {
    // OpenAPI Specification for the /api/create endpoint
    const openApiSpec = {
        openapi: "3.0.0",
        info: {
            title: "Notepad++ Lite API",
            version: "1.0.0",
            description: "API dành cho Telegram Bot để rút gọn và chia sẻ nội dung Notepad."
        },
        servers: [
            {
                url: "/",
                description: "Current Server"
            }
        ],
        paths: {
            "/api/create": {
                get: {
                    summary: "Rút gọn URL từ văn bản",
                    description: "Nén nội dung văn bản truyền vào, tạo liên kết truy cập Notepad rút gọn kèm mã QR.",
                    parameters: [
                        {
                            name: "text",
                            in: "query",
                            required: true,
                            schema: {
                                type: "string"
                            },
                            description: "Nội dung văn bản bạn muốn lưu vào Notepad."
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Thành công",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            success: { type: "boolean", example: true },
                                            short_url: { type: "string", example: "http://spoo.me/12345" },
                                            original_url: { type: "string", example: "https://your-domain.vercel.app/?data=..." },
                                            qr_code_url: { type: "string", example: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=..." }
                                        }
                                    }
                                }
                            }
                        },
                        "400": {
                            description: "Lỗi dữ liệu đầu vào (ví dụ: thiếu tham số text)"
                        },
                        "405": {
                            description: "Phương thức không được hỗ trợ (chỉ hỗ trợ GET)"
                        }
                    }
                }
            }
        }
    };

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Notepad API - Swagger UI</title>
    <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.css" />
    <style>
        body { margin: 0; padding: 0; }
        .swagger-ui .topbar { background-color: #272822; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                spec: ${JSON.stringify(openApiSpec)},
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout"
            });
            window.ui = ui;
        };
    </script>
</body>
</html>
`;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
};
