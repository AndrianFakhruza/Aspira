<?php
// Load .env if present and configure debug/other envs
if (file_exists(__DIR__ . '/.env')) {
    $env_lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if (is_array($env_lines)) {
        foreach ($env_lines as $line) {
            $trimmed = trim($line);
            if ($trimmed === '' || str_starts_with($trimmed, '#') || str_starts_with($trimmed, ';')) {
                continue;
            }
            if (strpos($trimmed, '=') === false) {
                continue;
            }
            [$key, $value] = explode('=', $trimmed, 2);
            $key = trim($key);
            $value = trim($value);
            if ($value !== '' && preg_match('/^".*"$/', $value)) {
                $value = trim($value, '"');
            }
            if ($key !== '') {
                putenv($key . '=' . $value);
            }
        }
    }
}
$APP_DEBUG = getenv('APP_DEBUG') ?: '0';
if ($APP_DEBUG === '1') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
}
// Start server-side session (use cookie-based PHP sessions)
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'httponly' => true,
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
        'samesite' => 'Lax',
    ]);
    session_start();
}

// --- MEMUAT PHPMailer ---
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// PASTIKAN PATH INI SESUAI DENGAN LOKASI FILE PHPMailer DI SERVER ANDA
require 'vendor/phpmailer/phpmailer/src/Exception.php'; 
require 'vendor/phpmailer/phpmailer/src/PHPMailer.php';
require 'vendor/phpmailer/phpmailer/src/SMTP.php';
// -------------------------

// CORS handling: allow wildcard only in debug; in production use ALLOWED_ORIGINS env
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $allowed = array_filter(array_map('trim', explode(',', getenv('ALLOWED_ORIGINS') ?: '')));
    if ($APP_DEBUG === '1' && empty($allowed)) {
        $allowed = [$_SERVER['HTTP_ORIGIN']];
    }
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowed, true)) {
        header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
        header('Access-Control-Allow-Credentials: true');
    }
}
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Access-Control-Allow-Methods: GET, POST, DELETE, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// =========================================================================
//                         KONFIGURASI UMUM & DB
// =========================================================================

// --- KONFIGURASI DATABASE ---
<<<<<<< HEAD
$db_host = getenv('DB_HOST') ?: 'localhost';
$db_user = getenv('DB_USER') ?: 'root';
$db_pass = getenv('DB_PASS') ?: '';
$db_name = getenv('DB_NAME') ?: 'aspira';
=======
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "aspira_db";
>>>>>>> 195fbe6b4d4da25eedfa3b58c18c0a19ec047965

$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);

if ($conn->connect_error) {
    http_response_code(500);
    error_log('DB CONNECT ERROR: ' . $conn->connect_error);
    echo json_encode(['success' => false, 'message' => 'Koneksi database gagal.']);
    exit();
}

// --- KONFIGURASI SMTP ---
$smtp_config = [
    'host'     => getenv('SMTP_HOST') ?: 'smtp.gmail.com',
    'username' => getenv('SMTP_USER') ?: '',
    'password' => getenv('SMTP_PASS') ?: '',
    'port'     => intval(getenv('SMTP_PORT') ?: 587),
    'secure'   => PHPMailer::ENCRYPTION_STARTTLS,
    'admin_email' => getenv('ADMIN_EMAIL') ?: '',
    'admin_name' => getenv('ADMIN_NAME') ?: 'Admin Aspira'
];

// --- KONFIGURASI DAN SETUP BANNER ---
$upload_dir = 'uploads/banners/'; 
if (!is_dir($upload_dir)) {
    if (!mkdir($upload_dir, 0777, true)) { 
        error_log("Gagal membuat direktori upload: " . $upload_dir);
    }
}
// ------------------------------------

$action = $_GET['action'] ?? null;
$method = $_SERVER['REQUEST_METHOD'];

function api_error(int $status, string $message): void {
    http_response_code($status);
    echo json_encode(['success' => false, 'message' => $message]);
    exit;
}

function require_auth(array $roles = []): void {
    if (empty($_SESSION['user_id']) || empty($_SESSION['role'])) {
        api_error(401, 'Sesi tidak valid atau telah berakhir. Silakan login kembali.');
    }
    if ($roles && !in_array(strtolower($_SESSION['role']), $roles, true)) {
        api_error(403, 'Anda tidak memiliki izin untuk melakukan aksi ini.');
    }
}

function is_authenticated(): bool {
    return !empty($_SESSION['user_id']) && !empty($_SESSION['role']);
}

function form_status(array $structure): string {
    $status = strtolower((string)($structure['status'] ?? 'published'));
    return in_array($status, ['draft', 'published', 'closed'], true) ? $status : 'draft';
}

// Quick endpoints: GET action=get_profile -> return session info; GET action=logout -> destroy session
if ($method === 'GET' && ($action === 'get_profile' || $action === 'logout')) {
    if ($action === 'logout') {
        session_unset();
        session_destroy();
        echo json_encode(['success' => true, 'message' => 'Logged out']);
        exit();
    }

    if (isset($_SESSION['user_id'])) {
        echo json_encode(['success' => true, 'user' => ['user_id' => $_SESSION['user_id'], 'username' => $_SESSION['username'] ?? null, 'role' => $_SESSION['role'] ?? null]]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    }
    exit();
}

// =========================================================================
//                       FUNGSI BANTU UNTUK MENGIRIM EMAIL (DENGAN DEBUGGING)
// =========================================================================
function send_smtp_email($to_email, $to_name, $subject, $body_html, $smtp_config, $is_admin_notification = false) {
    $mail = new PHPMailer(true);
    try {
        // --- PENGATURAN DEBUGGING EMAIL ---
        // Aktifkan logging debug ke output (untuk debugging cepat, nonaktifkan di produksi)
        // $mail->SMTPDebug = 2; 
        // $mail->Debugoutput = 'error_log';
        // ----------------------------------
        
        // Server settings
        $mail->isSMTP();
        $mail->Host       = $smtp_config['host'];
        $mail->SMTPAuth   = true;
        $mail->Username   = $smtp_config['username'];
        $mail->Password   = $smtp_config['password'];
        $mail->SMTPSecure = $smtp_config['secure'];
        $mail->Port       = $smtp_config['port'];
        $mail->CharSet    = 'UTF-8';
        
        // Recipients
        $mail->setFrom($smtp_config['username'], $smtp_config['admin_name']);
        $mail->addAddress($to_email, $to_name); 

        // Content
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $body_html;
        $mail->AltBody = strip_tags($body_html); 

        $mail->send();
        error_log("EMAIL SUCCESS: Email berhasil dikirim ke " . ($is_admin_notification ? "ADMIN" : "RESPONDEN: {$to_email}"));
        return true;
    } catch (Exception $e) {
        // Log error yang lebih detail
        error_log("EMAIL FAILED: Gagal mengirim email ke {$to_email}. Error: {$mail->ErrorInfo}");
        return false;
    }
}

// =========================================================================
//                      HANDLE POST & PUT REQUESTS
// =========================================================================

if ($method === 'POST' || $method === 'PUT') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Data JSON tidak valid. Error: ' . json_last_error_msg()]);
            exit;
        }

        switch ($action) {
            case 'login':
                $username = $data['username'] ?? '';
                $password = $data['password'] ?? '';

                $sql = "SELECT user_id, username, role, password FROM users WHERE username = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("s", $username);
                $stmt->execute();
                $result = $stmt->get_result();
                $user = $result->fetch_assoc();
                $stmt->close();

                if ($user) {
                    // Support legacy plain-text passwords: if stored password is plain and matches, rehash it
                    if (password_verify($password, $user['password'])) {
                        // hashed password matched
                    } elseif ($user['password'] === $password) {
                        // legacy plaintext match: rehash and update stored password
                        $newHash = password_hash($password, PASSWORD_DEFAULT);
                        $upd = $conn->prepare('UPDATE users SET password = ? WHERE user_id = ?');
                        $upd->bind_param('si', $newHash, $user['user_id']);
                        $upd->execute();
                        $upd->close();
                        $user['password'] = $newHash;
                    } else {
                        echo json_encode(['success' => false, 'message' => 'Username atau password salah.']);
                        break;
                    }

                    // Authentication succeeded — set server-side session
                    session_regenerate_id(true);
                    $_SESSION['user_id'] = $user['user_id'];
                    $_SESSION['username'] = $user['username'];
                    $_SESSION['role'] = $user['role'];

                    echo json_encode(['success' => true, 'message' => 'Login berhasil!', 'role' => $user['role'], 'username' => $user['username']]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Username atau password salah.']);
                }
                break;
            case 'add_admin_user':
                require_auth(['super admin', 'superadmin']);
                $username = $data['username'] ?? '';
                $email = $data['email'] ?? '';
                $password_raw = $data['password'] ?? '';
                $role = $data['role'] ?? 'Admin';

                if (empty($username) || empty($email) || empty($password_raw)) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Semua field wajib diisi (Username, Email, Password).']);
                    exit;
                }

                $sql_check = "SELECT COUNT(*) FROM users WHERE username = ? OR email = ?";
                $stmt_check = $conn->prepare($sql_check);
                $stmt_check->bind_param("ss", $username, $email);
                $stmt_check->execute();
                $count = $stmt_check->get_result()->fetch_row()[0];
                $stmt_check->close();

                if ($count > 0) {
                    http_response_code(409);
                    echo json_encode(['success' => false, 'message' => 'Username atau Email sudah terdaftar.']);
                    exit;
                }
                
                $password_to_save = password_hash($password_raw, PASSWORD_DEFAULT); 

                $sql = "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("ssss", $username, $email, $password_to_save, $role);

                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Akun admin berhasil ditambahkan.']);
                } else {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Gagal menyimpan akun admin. Error SQL: ' . $conn->error]);
                }
                $stmt->close();
                break;

            case 'save_form': 
            case 'update_form':
                require_auth(['admin', 'super admin', 'superadmin']);
                $form_id = $data['form_id'] ?? null;
                
                $form_structure_data = $data['form_structure'] ?? [];
                $form_structure_data['status'] = form_status($form_structure_data);
                $allowedFieldTypes = ['text', 'number', 'email', 'date', 'textarea', 'radio', 'select', 'checkbox', 'rating'];
                $normalizedFields = [];
                foreach (($form_structure_data['fields'] ?? []) as $field) {
                    if (!is_array($field)) continue;
                    $fieldId = (string)($field['id'] ?? '');
                    $fieldType = strtolower((string)($field['type'] ?? 'text'));
                    if (!preg_match('/^[A-Za-z0-9_-]{1,80}$/', $fieldId) || !in_array($fieldType, $allowedFieldTypes, true)) continue;
                    $options = array_values(array_filter(array_map(
                        fn($option) => mb_substr(trim(strip_tags((string)$option)), 0, 300),
                        is_array($field['options'] ?? null) ? $field['options'] : []
                    ), fn($option) => $option !== ''));
                    $normalizedFields[] = [
                        'id' => $fieldId,
                        'type' => $fieldType,
                        'label' => mb_substr(trim(strip_tags((string)($field['label'] ?? 'Pertanyaan'))), 0, 300),
                        'placeholder' => mb_substr(trim(strip_tags((string)($field['placeholder'] ?? ''))), 0, 300),
                        'required' => !empty($field['required']),
                        'options' => $options,
                        'is_permanent' => !empty($field['is_permanent']),
                        'min_length' => filter_var($field['min_length'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]) === false ? null : filter_var($field['min_length'], FILTER_VALIDATE_INT),
                        'max_length' => filter_var($field['max_length'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) === false ? null : filter_var($field['max_length'], FILTER_VALIDATE_INT),
                    ];
                }
                $form_structure_data['fields'] = $normalizedFields;
                $form_title = $form_structure_data['title'] ?? null;
                $form_description = $form_structure_data['description'] ?? null;
                $form_structure_json = json_encode($form_structure_data);
                
                $banner_data = $data['banner_data'] ?? null;
                $banner_path = $data['banner_url'] ?? null;

                if (empty($form_title)) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Judul formulir wajib diisi.']);
                    exit;
                }
                
                // --- TAHAP 1: HANDLE BANNER UPLOAD (Base64) ---
                $old_path = null;
                if ($form_id) {
                    $stmt_old = $conn->prepare("SELECT banner_path FROM forms WHERE form_id = ?");
                    $stmt_old->bind_param("i", $form_id);
                    $stmt_old->execute();
                    $old_path_result = $stmt_old->get_result()->fetch_assoc();
                    $old_path = $old_path_result['banner_path'] ?? null;
                    $stmt_old->close();
                    
                    if ($old_path && empty($banner_data)) {
                        $banner_path = $old_path;
                    }
                }

                if ($banner_data && strpos($banner_data, 'data:image') === 0) {
                    if ($old_path && file_exists($old_path)) {
                        @unlink($old_path);
                    }

                    $parts = explode(',', $banner_data, 2); 
                    if (count($parts) < 2) {
                        $banner_path = $old_path; 
                    } else {
                        $type = $parts[0];
                        $data_base64 = $parts[1];
                        $image_data = base64_decode($data_base64);
                        
                        $extension = 'jpg';
                        if (strpos($type, 'png') !== false) $extension = 'png';
                        if (strpos($type, 'jpeg') !== false) $extension = 'jpg';

                        $file_name = uniqid('banner_') . '.' . $extension;
                        $file_path = $upload_dir . $file_name;
                        
                        if (is_writable($upload_dir) && @file_put_contents($file_path, $image_data)) {
                            $banner_path = $file_path;
                        } else {
                            error_log("Gagal menyimpan file banner. Periksa izin tulis (chmod 777) pada folder 'uploads/banners/'!");
                            $banner_path = null; 
                        }
                    }
                } elseif (($banner_data === null || $banner_data === "") && $form_id) {
                    $path_to_delete = $old_path ?? $banner_path;
                    if ($path_to_delete && file_exists($path_to_delete)) {
                        @unlink($path_to_delete);
                    }
                    $banner_path = null;
                } 
                
                // --- TAHAP 2: SIMPAN KE DATABASE ---

                if ($action === 'save_form') { // CREATE
                    $temp_link = 'TEMP';
                    $sql = "INSERT INTO forms (form_title, form_description, form_structure, banner_path, form_link_unique) VALUES (?, ?, ?, ?, ?)";
                    $stmt = $conn->prepare($sql);
                    $stmt->bind_param("sssss", $form_title, $form_description, $form_structure_json, $banner_path, $temp_link);
                    
                    if ($stmt->execute()) {
                        $last_id = $conn->insert_id;
                        $unique_link_updated = 'form_public.html?id=' . $last_id;
                        
                        $update_sql = "UPDATE forms SET form_link_unique = ? WHERE form_id = ?";
                        $update_stmt = $conn->prepare($update_sql);
                        $update_stmt->bind_param("si", $unique_link_updated, $last_id);
                        $update_stmt->execute();
                        $update_stmt->close();
                        
                        echo json_encode(['success' => true, 'message' => 'Formulir berhasil disimpan.', 'form_link' => $unique_link_updated, 'form_id' => $last_id]);
                    } else {
                        http_response_code(500);
                        echo json_encode(['success' => false, 'message' => 'Gagal menyimpan formulir. Error SQL: ' . $conn->error]);
                    }
                    $stmt->close();

                } elseif ($action === 'update_form') { // UPDATE
                    $sql = "UPDATE forms SET form_title = ?, form_description = ?, form_structure = ?, banner_path = ? WHERE form_id = ?";
                    $stmt = $conn->prepare($sql);
                    $stmt->bind_param("ssssi", $form_title, $form_description, $form_structure_json, $banner_path, $form_id);
                    
                    if ($stmt->execute()) {
                        echo json_encode(['success' => true, 'message' => 'Formulir berhasil diperbarui.']);
                    } else {
                        http_response_code(500);
                        echo json_encode(['success' => false, 'message' => 'Gagal memperbarui formulir. Error SQL: ' . $conn->error]);
                    }
                    $stmt->close();
                }
                break;

            case 'submit_feedback':
                $form_id = $data['form_id'] ?? null;
                $raw_response_data = $data['response_data'] ?? [];
                
                if (!$form_id) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Form ID tidak valid.']);
                    exit();
                }

                // --- 1. AMBIL STRUKTUR FORM UNTUK MAPPING ---
                $sql_form = "SELECT form_title, form_structure FROM forms WHERE form_id = ?";
                $stmt_form = $conn->prepare($sql_form);
                $stmt_form->bind_param("i", $form_id);
                $stmt_form->execute();
                $form_record = $stmt_form->get_result()->fetch_assoc();
                $stmt_form->close();
                
                if (!$form_record) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Formulir tidak ditemukan.']);
                    exit();
                }

                $form_structure = json_decode($form_record['form_structure'] ?? '[]', true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    $form_structure = ['fields' => []];
                }

                $form_title = $form_record['form_title'] ?? ($form_structure['title'] ?? 'Formulir Tanpa Judul');
                $fields_definition = $form_structure['fields'] ?? [];

                if (form_status($form_structure) !== 'published') {
                    api_error(403, 'Formulir ini belum tersedia untuk menerima respons.');
                }

                $validated_response_data = [];
                foreach ($fields_definition as $field) {
                    $fieldId = (string)($field['id'] ?? '');
                    if ($fieldId === '') continue;
                    $value = $raw_response_data[$fieldId] ?? null;
                    $label = trim((string)($field['label'] ?? 'Pertanyaan'));
                    $isEmpty = $value === null || $value === '' || (is_array($value) && count($value) === 0);
                    if (!empty($field['required']) && $isEmpty) api_error(422, "{$label} wajib diisi.");
                    if ($isEmpty) continue;
                    if (is_array($value)) {
                        $value = array_values(array_filter($value, fn($item) => is_scalar($item) && mb_strlen((string)$item) <= 1000));
                    } elseif (!is_scalar($value) || mb_strlen((string)$value) > 5000) {
                        api_error(422, "Jawaban untuk {$label} tidak valid.");
                    }
                    $type = strtolower((string)($field['type'] ?? 'text'));
                    $length = is_array($value) ? null : mb_strlen((string)$value);
                    $minLength = filter_var($field['min_length'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]);
                    $maxLength = filter_var($field['max_length'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
                    if ($length !== null && $minLength !== false && $minLength !== null && $length < $minLength) api_error(422, "{$label} minimal {$minLength} karakter.");
                    if ($length !== null && $maxLength !== false && $maxLength !== null && $length > $maxLength) api_error(422, "{$label} maksimal {$maxLength} karakter.");
                    if ($type === 'number' && !is_numeric($value)) api_error(422, "{$label} harus berupa angka.");
                    if (($type === 'email' || strtolower($label) === 'email') && !filter_var((string)$value, FILTER_VALIDATE_EMAIL)) api_error(422, 'Format email tidak valid.');
                    if (in_array($type, ['radio', 'select'], true) && !in_array($value, $field['options'] ?? [], true)) api_error(422, "Pilihan untuk {$label} tidak valid.");
                    if ($type === 'checkbox' && (!is_array($value) || array_diff($value, $field['options'] ?? []))) api_error(422, "Pilihan untuk {$label} tidak valid.");
                    $validated_response_data[$fieldId] = $value;
                }
                $raw_response_data = $validated_response_data;
                
                // --- 2. BUAT MAP ID -> LABEL ---
                $id_to_label_map = [];
                $respondent_email = '';
                $respondent_name = 'Responden'; 

                foreach ($fields_definition as $field) {
                    $label_raw = trim($field['label'] ?? '');
                    
                    if (!empty($label_raw)) {
                        $clean_label = preg_replace('/\s+/', '_', $label_raw);
                        $json_safe_label = preg_replace('/[^a-zA-Z0-9_]/', '', $clean_label);
                        
                        if (!empty($json_safe_label)) {
                            $id_to_label_map[$field['id']] = $json_safe_label;
                            
                            // Ekstraksi Email dan Nama (Berdasarkan Label yang Dibersihkan)
                            if (strtolower($json_safe_label) === 'email' && isset($raw_response_data[$field['id']])) {
                                $respondent_email = $raw_response_data[$field['id']];
                            }
                            if ((strtolower($json_safe_label) === 'nama' || strtolower($json_safe_label) === 'namalengkap') && isset($raw_response_data[$field['id']])) {
                                $respondent_name = $raw_response_data[$field['id']];
                            }
                        }
                    }
                }

                // --- 3. LAKUKAN PEMETAAN DATA JAWABAN (digunakan untuk konten email) ---
                $mapped_response_data = [];
                $email_content_table = '<h3>Detail Respon:</h3><table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">';
                
                foreach ($raw_response_data as $field_id => $answer_value) {
                    $label = $id_to_label_map[$field_id] ?? $field_id;
                    $display_label = str_replace('_', ' ', $label);
                    
                    if (is_array($answer_value)) {
                         $answer_display = implode(', ', $answer_value);
                    } else {
                         $answer_display = htmlspecialchars($answer_value);
                    }

                    $email_content_table .= "<tr><td><b>{$display_label}</b></td><td>{$answer_display}</td></tr>";

                    $mapped_response_data[$label] = $answer_value;
                }
                $email_content_table .= '</table>';
                
                $submission_time = date('Y-m-d H:i:s');
                
                // --- 4. SIMPAN DATA KE DATABASE ---
                $data_responden_json = json_encode($raw_response_data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); 
                
                $sql = "INSERT INTO responses (form_id, data_responden, submitted_at) VALUES (?, ?, ?)";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("iss", $form_id, $data_responden_json, $submission_time);
                
                if ($stmt->execute()) {
                    
                    // --- 5. KIRIM EMAIL KONFIRMASI KE RESPONDEN (Jika email valid) ---
                    $email_sent_to_respondent = false;
                    if (filter_var($respondent_email, FILTER_VALIDATE_EMAIL)) {
                        $subject_user = "Konfirmasi Pengisian Form: {$form_title}";
                        $body_user = "
                            <html>
                            <body style='font-family: Arial, sans-serif;'>
                                <h2>Terima kasih, {$respondent_name}!</h2>
                                <p>Formulir **{$form_title}** Anda telah berhasil kami terima pada {$submission_time} WIB.</p>
                                {$email_content_table}
                                <p>Kami akan segera memproses data Anda.</p>
                                <p>Hormat kami,<br>{$smtp_config['admin_name']}</p>
                            </body>
                            </html>
                        ";
                        $email_sent_to_respondent = send_smtp_email($respondent_email, $respondent_name, $subject_user, $body_user, $smtp_config, false);
                    }
                    
                    // --- 6. KIRIM EMAIL NOTIFIKASI KE ADMIN ---
                    $subject_admin = "[NOTIFIKASI] Feedback Baru Masuk untuk Form: {$form_title}";
                    $body_admin = "
                        <html>
                        <body style='font-family: Arial, sans-serif;'>
                            <h2>Feedback Baru Masuk!</h2>
                            <p>Telah masuk satu feedback baru untuk formulir **{$form_title}** pada {$submission_time} WIB.</p>
                            <p>Diisi oleh: {$respondent_name} ({$respondent_email})</p>
                            {$email_content_table}
                            <p>Silakan cek panel admin untuk detail selengkapnya.</p>
                        </body>
                        </html>
                    ";
                    $email_sent_to_admin = send_smtp_email($smtp_config['admin_email'], $smtp_config['admin_name'], $subject_admin, $body_admin, $smtp_config, true);

                    // Menyiapkan pesan balasan ke klien (tidak peduli email gagal/sukses, karena data sudah tersimpan)
                    $email_status_message = "Data berhasil disimpan.";
                    if (!$email_sent_to_admin || (!$email_sent_to_respondent && filter_var($respondent_email, FILTER_VALIDATE_EMAIL))) {
                        // Tambahkan peringatan jika email GAGAL dikirim
                         $email_status_message .= " PERINGATAN: Ada masalah saat mengirim email notifikasi. Silakan cek error log server Anda.";
                    } else {
                         $email_status_message .= " Konfirmasi email berhasil dikirim.";
                    }
                    
                    echo json_encode(['success' => true, 'message' => $email_status_message]);
                } else {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Gagal menyimpan feedback. Error SQL: ' . $conn->error]);
                }
                $stmt->close();
                
                break;

            default:
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Aksi POST tidak dikenal.']);
                break;
        }
    } catch (\Throwable $e) {
        http_response_code(500);
        error_log("FATAL PHP ERROR: " . $e->getMessage() . " on line " . $e->getLine());
        echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan server internal.']);
    }
}

// =========================================================================
//                      HANDLE GET REQUESTS (Sama seperti sebelumnya)
// =========================================================================

if ($method === 'GET') {
    switch ($action) {
        case 'get_admin_users':
            require_auth(['super admin', 'superadmin']);
            try {
                $sql = "SELECT user_id, username, email, role, created_at FROM users ORDER BY user_id DESC";
                $result = $conn->query($sql);
                $users_raw = $result->fetch_all(MYSQLI_ASSOC);
                
                $users = array_map(function($u) { 
                    $u['is_active'] = true; 
                    return $u; 
                }, $users_raw);

                echo json_encode(['success' => true, 'users' => $users]);
            } catch (\Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Database error saat mengambil pengguna: ' . $e->getMessage()]);
            }
            break;
        
        case 'get_forms':
            require_auth(['viewer', 'admin', 'super admin', 'superadmin']);
            $sql = "SELECT form_id, form_title, form_link_unique, created_at, banner_path FROM forms ORDER BY created_at DESC";
            $result = $conn->query($sql);
            $forms = [];
            if ($result->num_rows > 0) {
                while($row = $result->fetch_assoc()) {
                    if (!isset($row['form_id'])) continue; 

                    $sql_responses_count = "SELECT COUNT(*) as responses_count FROM responses WHERE form_id = ?";
                    $stmt_responses_count = $conn->prepare($sql_responses_count);
                    $stmt_responses_count->bind_param("i", $row['form_id']);
                    $stmt_responses_count->execute();
                    $responses_count = $stmt_responses_count->get_result()->fetch_assoc()['responses_count'];
                    $stmt_responses_count->close();
                    
                    $row['responses_count'] = $responses_count;
                    $forms[] = $row;
                }
            }
            echo json_encode(['success' => true, 'forms' => $forms]);
            break;
        
        case 'get_form_structure':
            $form_id = $_GET['id'] ?? null;
            if ($form_id) {
                $sql = "SELECT form_title, form_description, form_structure, banner_path FROM forms WHERE form_id = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("i", $form_id);
                $stmt->execute();
                $result = $stmt->get_result();
                $form = $result->fetch_assoc();
                $stmt->close();
                
                if ($form) {
                    $form_structure_json = $form['form_structure'] ?? '{"fields": []}'; 
                    $form_structure_decoded = json_decode($form_structure_json, true);
                    
                    if (json_last_error() !== JSON_ERROR_NONE) {
                           $form_structure_decoded = ['title' => $form['form_title'], 'description' => $form['form_description'], 'fields' => []];
                    }
                    
                    $fields = $form_structure_decoded['fields'] ?? [];
                    $status = form_status($form_structure_decoded);
                    if ($status !== 'published' && !is_authenticated()) {
                        api_error(403, 'Formulir ini belum tersedia untuk umum.');
                    }

                    echo json_encode([
                        'success' => true, 
                        'form' => [
                            'form_id' => $form_id, 
                            'title' => $form_structure_decoded['title'] ?? $form['form_title'] ?? 'Formulir Tanpa Judul', 
                            'description' => $form_structure_decoded['description'] ?? $form['form_description'] ?? '', 
                            'fields' => $fields,
                            'status' => $status,
                            'banner_url' => $form['banner_path'] ?? null 
                        ]
                    ]);
                } else {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Formulir tidak ditemukan.']);
                }
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Form ID tidak valid.']);
            }
            break;
        
        case 'get_form_and_responses':
            require_auth(['viewer', 'admin', 'super admin', 'superadmin']);
            $form_id = $_GET['id'] ?? null;
            if ($form_id) {
                // --- 1. AMBIL STRUKTUR FORM ---
                $sql_form_structure = "SELECT form_title, form_structure FROM forms WHERE form_id = ?";
                $stmt_form_structure = $conn->prepare($sql_form_structure);
                $stmt_form_structure->bind_param("i", $form_id);
                $stmt_form_structure->execute();
                $form_result = $stmt_form_structure->get_result();
                $form_data = $form_result->fetch_assoc();
                $stmt_form_structure->close();

                if (!$form_data) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Formulir tidak ditemukan.']);
                    exit();
                }

                $form_structure = json_decode($form_data['form_structure'] ?? '[]', true);
                $form_title = $form_data['form_title'] ?? ($form_structure['title'] ?? 'Formulir Tanpa Judul');
                $form_fields = $form_structure['fields'] ?? [];

                // --- 2. BUAT MAPPER ID ke LABEL (Hardened Mapping) ---
                $id_to_label_map = [];
                foreach ($form_fields as $field) {
                    $label_raw = trim($field['label'] ?? '');
                    
                    if (!empty($label_raw)) {
                        $clean_label = preg_replace('/\s+/', '_', $label_raw);
                        $json_safe_label = preg_replace('/[^a-zA-Z0-9_]/', '', $clean_label);
                        
                        if (!empty($json_safe_label)) {
                            $id_to_label_map[$field['id']] = $json_safe_label;
                        }
                    }
                }

                $sql_total = "SELECT COUNT(*) as total FROM responses WHERE form_id = ?";
                $stmt_total = $conn->prepare($sql_total);
                $stmt_total->bind_param("i", $form_id);
                $stmt_total->execute();
                $total_responses = $stmt_total->get_result()->fetch_assoc()['total'];
                $stmt_total->close();

                // --- 3. AMBIL DAN MAP RESPON ---
                $sql_responses = "SELECT data_responden, submitted_at FROM responses WHERE form_id = ? ORDER BY submitted_at DESC";
                $stmt_responses = $conn->prepare($sql_responses);
                $stmt_responses->bind_param("i", $form_id);
                $stmt_responses->execute();
                $all_responses_raw = $stmt_responses->get_result()->fetch_all(MYSQLI_ASSOC);
                $stmt_responses->close();

                $responses_data = [];
                foreach ($all_responses_raw as $res) {
                    $data_decoded = json_decode($res['data_responden'] ?? '[]', true);
                    
                    // Lakukan mapping dari Field ID ke Label
                    $mapped_response = [];
                    foreach ($data_decoded as $field_id => $answer_value) {
                        $new_key = $id_to_label_map[$field_id] ?? $field_id; 
                        $mapped_response[$new_key] = $answer_value;
                    }

                    $mapped_response['submitted_at'] = $res['submitted_at']; 
                    $responses_data[] = $mapped_response;
                }

                echo json_encode([
                    'success' => true, 
                    'form_title' => $form_title, 
                    'form_fields' => $form_fields, 
                    'total_responses' => $total_responses, 
                    'responses' => $responses_data
                ]);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Form ID tidak valid.']);
            }
            break;
        
        case 'export_excel':
            require_auth(['viewer', 'admin', 'super admin', 'superadmin']);
            $form_id = $_GET['id'] ?? null;
            if ($form_id) {
                $sql_form = "SELECT form_title, form_structure FROM forms WHERE form_id = ?";
                $stmt_form = $conn->prepare($sql_form);
                $stmt_form->bind_param("i", $form_id);
                $stmt_form->execute();
                $form = $stmt_form->get_result()->fetch_assoc();
                $stmt_form->close();
                
                if ($form) {
                    $form_data = json_decode($form['form_structure'] ?? '[]', true);
                    $form_title_clean = preg_replace('/[^a-zA-Z0-9-]/', '_', $form['form_title']);
                    $filename = "feedback_{$form_title_clean}_" . date('Ymd_His') . ".xls";

                    header('Content-Type: application/vnd.ms-excel');
                    header('Content-Disposition: attachment; filename="' . $filename . '"');
                    
                    $output = fopen('php://output', 'w');
                    
                    $headers = ['Waktu Submit'];
                    foreach ($form_data['fields'] as $field) {
                        $headers[] = $field['label'];
                    }
                    
                    echo "<table><thead><tr>";
                    foreach($headers as $header) {
                        echo "<th>" . htmlspecialchars($header) . "</th>";
                    }
                    echo "</tr></thead><tbody>";

                    $sql_responses = "SELECT data_responden, submitted_at FROM responses WHERE form_id = ?";
                    $stmt_responses = $conn->prepare($sql_responses);
                    $stmt_responses->bind_param("i", $form_id);
                    $stmt_responses->execute();
                    $all_responses_raw = $stmt_responses->get_result()->fetch_all(MYSQLI_ASSOC);
                    $stmt_responses->close();
                    
                    foreach ($all_responses_raw as $res) {
                        $response_data_raw = json_decode($res['data_responden'] ?? '[]', true);
                        $response_data = $response_data_raw['response_data'] ?? $response_data_raw; 
                        
                        echo "<tr>";
                        echo "<td>" . htmlspecialchars(date('Y-m-d H:i:s', strtotime($res['submitted_at']))) . "</td>";
                        foreach ($form_data['fields'] as $field) {
                            $value = $response_data[$field['id']] ?? ''; 
                            if (is_array($value)) {
                                $value = implode(', ', $value);
                            }
                            echo "<td>" . htmlspecialchars($value) . "</td>";
                        }
                        echo "</tr>";
                    }
                    echo "</tbody></table>";
                    
                    fclose($output);
                } else {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Formulir tidak ditemukan.']);
                }
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Form ID tidak valid.']);
            }
            break;
        
        default:
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Aksi GET tidak dikenal.']);
            break;
    }
}

// =========================================================================
//                      HANDLE DELETE REQUESTS (Sama seperti sebelumnya)
// =========================================================================

if ($method === 'DELETE') {
    switch ($action) {
        case 'delete_admin_user':
            $user_id = $_GET['id'] ?? null;
            if (empty($user_id)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID user tidak ditemukan.']);
                exit;
            }
            // authorization: only Super Admin allowed
            if (!isset($_SESSION['role']) || (strtolower($_SESSION['role']) !== 'super admin' && strtolower($_SESSION['role']) !== 'superadmin')) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Akses ditolak.']);
                exit;
            }

            try {
                $sql = "DELETE FROM users WHERE user_id = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("i", $user_id);
                
                if ($stmt->execute() && $conn->affected_rows > 0) {
                    echo json_encode(['success' => true, 'message' => 'Akun admin berhasil dihapus.']);
                } else {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Akun admin tidak ditemukan.']);
                }
                $stmt->close();
            } catch (\Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Gagal menghapus akun: ' . $e->getMessage()]);
            }
            break;
        
        case 'delete_form':
            $form_id = $_GET['id'] ?? null;
            if ($form_id) {
                // authorization: only Admin or Super Admin allowed
                if (!isset($_SESSION['role']) || !in_array(strtolower($_SESSION['role']), ['admin','super admin','superadmin'])) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'Akses ditolak.']);
                    exit;
                }

                // 1. Dapatkan path banner dan hapus file
                $sql_get_path = "SELECT banner_path FROM forms WHERE form_id = ?";
                $stmt_get_path = $conn->prepare($sql_get_path);
                $stmt_get_path->bind_param("i", $form_id);
                $stmt_get_path->execute();
                $banner_path = $stmt_get_path->get_result()->fetch_assoc()['banner_path'] ?? null;
                $stmt_get_path->close();

                if ($banner_path && file_exists($banner_path)) {
                    @unlink($banner_path); 
                }
                
                // 2. Hapus responses yang terkait
                $sql_delete_responses = "DELETE FROM responses WHERE form_id = ?";
                $stmt_delete_responses = $conn->prepare($sql_delete_responses);
                $stmt_delete_responses->bind_param("i", $form_id);
                $stmt_delete_responses->execute();
                $stmt_delete_responses->close();


                // 3. Hapus form utama
                $sql = "DELETE FROM forms WHERE form_id = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("i", $form_id);
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Formulir berhasil dihapus.']);
                } else {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Gagal menghapus formulir.']);
                }
                $stmt->close();
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Form ID tidak valid.']);
            }
            break;
    }
}

$conn->close();
?>
r