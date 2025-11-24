using erp from '../db/schema';

service AuthService @(path: '/auth') {
  
  // Acción para loguearse. Toma el usuario y la contraseña, y devuelve
  // un JSON stringificado con el Token de acceso (String).
  action login(username: String, password: String) returns String;
}