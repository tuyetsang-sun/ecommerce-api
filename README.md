# PROMPT 2 — E-commerce RESTful API Monolithic

Sinh viên: Dao Thi Tuyet Sang  
MSSV: 23663021

Dự án RESTful API thương mại điện tử MVP sử dụng Node.js,
Express, Prisma ORM và PostgreSQL.

## 1. Công nghệ

- Node.js 24.
- Express 5.
- Prisma ORM và Prisma Client 6.19.3.
- PostgreSQL 16.
- JWT để xác thực.
- bcryptjs để băm mật khẩu.
- Docker Compose để chạy API và database.
- Postman để kiểm thử API.

## 2. Kiến trúc Monolithic

Các chức năng đăng ký, đăng nhập, xác thực và đặt hàng nằm
trong cùng một ứng dụng Express, được triển khai bằng một
image API.

PostgreSQL chạy trong container riêng để lưu dữ liệu.
Việc tách database thành container không làm ứng dụng
trở thành kiến trúc microservices.

| Thành phần | Trách nhiệm |
|---|---|
| `src/server.js` | Khởi động HTTP server |
| `src/app.js` | Cấu hình Express, routes và middleware |
| `src/config/` | Đọc cấu hình và tạo Prisma Client |
| `src/middlewares/` | Xác thực JWT và xử lý lỗi |
| `src/modules/auth/` | Đăng ký, đăng nhập, xem tài khoản |
| `src/modules/orders/` | Tạo đơn, xem đơn và shipment |
| `src/utils/` | Tiện ích dùng chung, gồm HttpError |
| `prisma/schema.prisma` | Khai báo mô hình dữ liệu |
| `prisma/migrations/` | Lịch sử thay đổi cấu trúc database |
| `prisma/seed.js` | Khởi tạo role và membership mặc định |
| `prisma/demo-products.sql` | Thêm sản phẩm X, Y bằng SQL |
| `Dockerfile` | Hướng dẫn build image API |
| `compose.yaml` | Cấu hình API, PostgreSQL và health check |

Luồng xử lý đặt hàng:
route → middleware xác thực → controller → service → Prisma → PostgreSQL.

## 3. Cấu hình môi trường và Git

- `.env`: chứa cấu hình thực tế, không đưa lên GitHub.
- `.env.example`: cấu hình mẫu, được đưa lên GitHub.
- `.gitignore`: loại `.env`, `node_modules` và các file không cần theo dõi.
- `.dockerignore`: loại `.env`, `node_modules` của máy host và
  các nội dung không cần đưa vào Docker build context.
- `package-lock.json`: lưu phiên bản thư viện để cài đặt nhất quán.

Các biến cấu hình chính:

| Biến | Ý nghĩa |
|---|---|
| `PORT` | Cổng API |
| `NODE_ENV` | Môi trường chạy |
| `POSTGRES_USER` | Tài khoản PostgreSQL |
| `POSTGRES_PASSWORD` | Mật khẩu PostgreSQL |
| `POSTGRES_DB` | Tên database |
| `POSTGRES_PORT` | Cổng PostgreSQL công bố trên máy host |
| `DATABASE_URL` | Chuỗi kết nối Prisma khi chạy trên máy host |
| `JWT_SECRET` | Khóa ký và xác minh JWT |
| `JWT_EXPIRES_IN_SECONDS` | Thời hạn token, tính bằng giây |

API chạy trên Windows kết nối database qua `localhost:15432`.
API chạy trong Compose kết nối qua `postgres:5432`.
Compose cấp DATABASE_URL tương ứng cho container API.

## 4. Database và Prisma ORM

Database gồm 7 bảng nghiệp vụ:

- Role.
- MemberShip.
- User.
- Product.
- Order.
- OrderDetail.
- Shipment.

Bảng `_prisma_migrations` được Prisma dùng để theo dõi migration.

Prisma ORM ánh xạ model trong `schema.prisma` sang bảng dữ liệu,
đồng thời cung cấp các phương thức JavaScript để truy vấn database.

Ví dụ sử dụng trong dự án:

- `findUnique`: tìm tài khoản hoặc sản phẩm.
- `create`: tạo tài khoản hoặc đơn hàng.
- `updateMany` với `decrement`: trừ tồn kho có điều kiện.
- `$transaction`: gom các thao tác đặt hàng thành một giao dịch.

OrderDetail sử dụng khóa chính ghép `(oid, pid)`.
Giá sản phẩm và đơn giá sử dụng Decimal.
Trường `createat` của Order lấy thời gian hiện hành bằng `@default(now())`.

## 5. Quy tắc nghiệp vụ

### Tài khoản

- Tài khoản mới được gán role `normal`.
- Tài khoản liên kết với membership `normal`, có score bằng 10.
- Mật khẩu được băm bằng bcryptjs.
- Phản hồi API không trả mật khẩu hoặc giá trị băm.
- Đăng nhập thành công trả accessToken.
- JWT được kiểm tra chữ ký, thời hạn, issuer và audience.

### Đặt hàng

- Phải có JWT hợp lệ.
- Người đặt được xác định từ tài khoản đã xác thực.
- Mỗi sản phẩm có số lượng mua là số nguyên dương.
- Không cho phép một pid xuất hiện nhiều lần trong cùng request.
- Giá mua lấy từ database.
- Tồn kho chỉ bị trừ khi đủ số lượng.
- Tạo Order, OrderDetail, Shipment và trừ tồn kho trong cùng transaction.
- Shipment mới có trạng thái `pending`.
- Nếu có lỗi, các thay đổi trong transaction được hoàn tác.
- Người dùng chỉ xem được đơn hàng và shipment của mình.

## 6. Chạy dự án bằng Docker Compose

Yêu cầu: Git, Docker Desktop, Node.js 24 và Postman.

Clone repository:

```bash
git clone https://github.com/tuyetsang-sun/ecommerce-api.git
cd ecommerce-api
```

Tạo cấu hình trên một bản clone mới:

```bash
cp .env.example .env
```

Sinh chuỗi ngẫu nhiên:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Chạy lệnh trên hai lần để lấy hai giá trị riêng:

1. Một giá trị cho POSTGRES_PASSWORD.
2. Một giá trị cho JWT_SECRET.

Sửa `.env`, đồng thời thay phần mật khẩu trong DATABASE_URL
cho khớp POSTGRES_PASSWORD.

Kiểm tra cấu hình và khởi động:

```bash
docker compose config --quiet
docker compose up -d --build --wait --wait-timeout 180
```

Khi khởi động, API chạy migration đã có và seed dữ liệu nền.

Kiểm tra container và log:

```bash
docker compose ps
docker compose logs --tail=80 api
```

Kiểm tra health:

```bash
curl -i http://localhost:3001/health
```

Kết quả khi sẵn sàng: HTTP 200 và database `up`.

Thêm sản phẩm mẫu bằng CLI:

```bash
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U ecommerce -d ecommerce < prisma/demo-products.sql
```

Xem sản phẩm và xác định pid:

```bash
docker compose exec -T postgres psql -U ecommerce -d ecommerce -c 'SELECT pid, pname, price, quantity FROM "Product" ORDER BY pid;'
```

Sau khi sửa mã nguồn, build lại API:

```bash
docker compose up -d --build --wait api
```

Dừng hệ thống:

```bash
docker compose stop
```

## 7. Danh sách API

| Method | Endpoint | JWT | Chức năng |
|---|---|---|---|
| GET | `/health` | Không | Kiểm tra API và kết nối database |
| POST | `/api/auth/register` | Không | Đăng ký |
| POST | `/api/auth/login` | Không | Đăng nhập, nhận token |
| GET | `/api/auth/me` | Có | Xem tài khoản hiện tại |
| POST | `/api/orders` | Có | Tạo đơn |
| GET | `/api/orders/:oid` | Có | Xem đơn và chi tiết |
| GET | `/api/orders/:oid/shipments` | Có | Xem shipment của đơn |

Trong Postman, chọn Authorization → Bearer Token và dán
giá trị accessToken nhận từ API đăng nhập.

Body đặt hàng, với pid tương ứng X = 1 và Y = 2:

```json
{
  "items": [
    { "pid": 1, "qty": 2 },
    { "pid": 2, "qty": 5 }
  ]
}
```

Sau khi đặt thành công, dùng oid trong phản hồi để xem đơn
và shipment bằng GET.

Mỗi POST thành công tạo một đơn mới và tiếp tục trừ tồn kho.

## 8. Kiểm thử theo phiếu chấm

| Kiểm thử | Kết quả mong đợi |
|---|---|
| Đăng ký hợp lệ | 201, role normal, membership score 10 |
| Đăng ký trùng username | 409 |
| Đăng nhập đúng | 200, có accessToken |
| Đăng nhập sai mật khẩu | 401 |
| Đặt hàng không có token | 401 |
| Token sai hoặc hết hạn | 401 |
| Đặt X × 2 và Y × 5 khi đủ kho | 201, có đơn, chi tiết và shipment |
| Xem đơn của mình | 200 |
| Xem shipment của đơn | 200, status pending |
| Đặt vượt tồn kho | 409, không thay đổi dữ liệu |
| Database hoạt động | Health 200, database up |
| Database dừng | Health 503, API chuyển unhealthy sau các lần kiểm tra lỗi |

Với tồn kho ban đầu X = 10 và Y = 20:

- Sau một đơn X × 2, Y × 5: tồn kho là 8 và 15.
- Sau hai đơn giống nhau: tồn kho là 6 và 10.

Kiểm tra các bảng bằng CLI:

```bash
docker compose exec -T postgres psql -U ecommerce -d ecommerce -c '\dt'
```

```bash
docker compose exec -T postgres psql -U ecommerce -d ecommerce -c 'SELECT oid, uid, createat FROM "Order" ORDER BY oid;'
```

```bash
docker compose exec -T postgres psql -U ecommerce -d ecommerce -c 'SELECT oid, pid, qty, unit_price FROM "OrderDetail" ORDER BY oid, pid;'
```

```bash
docker compose exec -T postgres psql -U ecommerce -d ecommerce -c 'SELECT pid, pname, quantity FROM "Product" ORDER BY pid;'
```

```bash
docker compose exec -T postgres psql -U ecommerce -d ecommerce -c 'SELECT shipid, oid, status FROM "Shipment" ORDER BY shipid;'
```