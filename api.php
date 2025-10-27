<?php
// TAMPILKAN SEMUA ERROR (Hanya untuk debugging)
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

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

            // --- ADMIN MANAGEMENT: ADD USER ---
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
            // --- END ADD USER ---


            case 'save_form': // CREATE
            case 'update_form': // UPDATE
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

                $form_structure = json_decode($form_record['form_structure'], true);
                $form_title = $form_record['form_title'] ?? ($form_structure['title'] ?? 'Formulir Tanpa Judul');
                $fields_definition = $form_structure['fields'] ?? [];
                
                // --- 2. BUAT MAP ID -> LABEL ---
                $id_to_label_map = [];
                foreach ($fields_definition as $field) {
                    // Bersihkan label: hanya alfanumerik dan spasi, lalu ganti spasi dengan underscore
                    $clean_label = preg_replace('/[^a-zA-Z0-9\s]/', '', $field['label']);
                    $json_safe_label = str_replace(' ', '_', trim($clean_label));
                    
                    if (!empty($json_safe_label)) {
                        $id_to_label_map[$field['id']] = $json_safe_label;
                    }
                }

                // --- 3. LAKUKAN PEMETAAN DATA JAWABAN ---
                $mapped_response_data = [];
                foreach ($raw_response_data as $field_id => $answer_value) {
                    // Gunakan label bersih, jika tidak ada, gunakan ID asli (fallback)
                    $new_key = $id_to_label_map[$field_id] ?? $field_id;
                    $mapped_response_data[$new_key] = $answer_value;
                }
                
                $submission_time = date('Y-m-d H:i:s');
                
                // --- 4. SIMPAN DATA ASLI KE DATABASE (Gunakan raw_response_data untuk kompatibilitas DB) ---
                $data_responden_json = json_encode($raw_response_data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); 
                
                $sql = "INSERT INTO responses (form_id, data_responden, submitted_at) VALUES (?, ?, ?)";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("iss", $form_id, $data_responden_json, $submission_time);
                
                if ($stmt->execute()) {
                    // --- 5. SIAPKAN DAN KIRIM PAYLOAD BERSIH KE WEBHOOK N8N ---
                    $payload_for_webhook = [
                        'form_id' => $form_id,
                        'form_title' => $form_title,
                        'submitted_at' => date('Y-m-d\TH:i:s.v\Z'), // Format ISO 8601 dengan milidetik
                        'response_data' => $mapped_response_data, // Data yang sudah di-mapping
                    ];
                    
                    // GANTI DENGAN URL WEBHOOK N8N ANDA YANG SESUNGGUHNYA
                    $webhook_url = 'http://localhost:5678/webhook-test/csr-notifier'; 
                    
                    $ch = curl_init($webhook_url);
                    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
                    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload_for_webhook));
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
                    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
                    
                    $webhook_response = curl_exec($ch);
                    $webhook_http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                    curl_close($ch);
                    
                    // Respon sukses ke klien
                    echo json_encode(['success' => true, 'message' => 'Feedback berhasil disimpan dan notifikasi dikirim.']);
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
//                      HANDLE GET REQUESTS
// =========================================================================

if ($method === 'GET') {
    switch ($action) {
        // --- ADMIN MANAGEMENT: GET ALL USERS ---
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
        // --- END GET ALL USERS ---
        
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
                    // Cek jika form_structure kosong atau null, beri default array kosong
                    $form_structure_json = $form['form_structure'] ?? '{"fields": []}'; 
                    $form_structure_decoded = json_decode($form_structure_json, true);
                    
                    // Pastikan dekode berhasil, jika gagal, gunakan default
                    if (json_last_error() !== JSON_ERROR_NONE) {
                           $form_structure_decoded = ['title' => $form['form_title'], 'description' => $form['form_description'], 'fields' => []];
                    }
                    
                    // Pastikan fields adalah array, jika tidak, beri default array kosong
                    $fields = $form_structure_decoded['fields'] ?? [];

                    echo json_encode([
                        'success' => true, 
                        'form' => [
                            'form_id' => $form_id, 
                            // Ambil title/description dari decoded structure jika ada, jika tidak, ambil dari kolom DB
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
                $sql_form_structure = "SELECT form_structure FROM forms WHERE form_id = ?";
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

                $form_structure = json_decode($form_data['form_structure'], true);
                $form_title = $form_structure['title'] ?? 'Formulir Tanpa Judul';
                $form_fields = $form_structure['fields'] ?? [];

                $sql_total = "SELECT COUNT(*) as total FROM responses WHERE form_id = ?";
                $stmt_total = $conn->prepare($sql_total);
                $stmt_total->bind_param("i", $form_id);
                $stmt_total->execute();
                $total_responses = $stmt_total->get_result()->fetch_assoc()['total'];
                $stmt_total->close();

                $sql_responses = "SELECT data_responden, submitted_at FROM responses WHERE form_id = ? ORDER BY submitted_at DESC";
                $stmt_responses = $conn->prepare($sql_responses);
                $stmt_responses->bind_param("i", $form_id);
                $stmt_responses->execute();
                $all_responses_raw = $stmt_responses->get_result()->fetch_all(MYSQLI_ASSOC);
                $stmt_responses->close();

                $responses_data = [];
                foreach ($all_responses_raw as $res) {
                    $data_decoded = json_decode($res['data_responden'], true);
                    $data_decoded['submitted_at'] = $res['submitted_at']; 
                    $responses_data[] = $data_decoded;
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
                    $form_data = json_decode($form['form_structure'], true);
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
                        $response_data_raw = json_decode($res['data_responden'], true);
                        // Data actual berada di dalam key 'response_data'
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
//                      HANDLE DELETE REQUESTS
// =========================================================================

if ($method === 'DELETE') {
    switch ($action) {
        // --- ADMIN MANAGEMENT: DELETE USER ---
        case 'delete_admin_user':
            $user_id = $_GET['id'] ?? null;
            if (empty($user_id)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID user tidak ditemukan.']);
                exit;
            }

            try {
                // Hapus user
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
        // --- END DELETE USER ---
        
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