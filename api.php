<?php
// TAMPILKAN SEMUA ERROR (Hanya untuk debugging)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// --- MEMUAT PHPMailer ---
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// PASTIKAN PATH INI SESUAI DENGAN LOKASI FILE PHPMailer DI SERVER ANDA
require 'vendor/phpmailer/phpmailer/src/Exception.php'; 
require 'vendor/phpmailer/phpmailer/src/PHPMailer.php';
require 'vendor/phpmailer/phpmailer/src/SMTP.php';
// -------------------------

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
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
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "aspira";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Koneksi database gagal: ' . $conn->connect_error]);
    exit();
}

// --- KONFIGURASI SMTP GMAIL ---
$smtp_config = [
    'host'     => 'smtp.gmail.com',
    'username' => 'admcsr561@gmail.com', // EMAIL ADMIN
    'password' => 'gnipfxmcpllngeic',            // SANDI APLIKASI 16 KARAKTER
    'port'     => 587,
    'secure'   => PHPMailer::ENCRYPTION_STARTTLS,
    'admin_email' => 'admcsr561@gmail.com', // PENERIMA NOTIFIKASI
    'admin_name' => 'Admin Aspira' 
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

                if ($user && $user['password'] === $password) {
                    echo json_encode(['success' => true, 'message' => 'Login berhasil!', 'role' => $user['role'], 'username' => $user['username']]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Username atau password salah.']);
                }
                break;
            case 'add_admin_user':
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
                
                $password_to_save = $password_raw; 

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
                $form_id = $data['form_id'] ?? null;
                
                $form_structure_data = $data['form_structure'] ?? [];
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
        echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan server internal. Detail: ' . $e->getMessage()]);
    }
}

// =========================================================================
//                      HANDLE GET REQUESTS (Sama seperti sebelumnya)
// =========================================================================

if ($method === 'GET') {
    switch ($action) {
        case 'get_admin_users':
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

                    echo json_encode([
                        'success' => true, 
                        'form' => [
                            'form_id' => $form_id, 
                            'title' => $form_structure_decoded['title'] ?? $form['form_title'] ?? 'Formulir Tanpa Judul', 
                            'description' => $form_structure_decoded['description'] ?? $form['form_description'] ?? '', 
                            'fields' => $fields,
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