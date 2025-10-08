// Imports
import { AUTH_REGISTER_API, AUTH_NEW_PASSWORD_API, AUTH_UPDATE_API, USERS_API, EMPLOYEES_API, ROLES_API } from "../config/constants.js";
import { getData, postData, putData, deleteData } from "../data/methods.js";
import { showError, showSuccess, showConfirmation } from "../utils/sweetAlert.js";
import { initializeDynamicMenu } from '../config/menu.js';

// ===== FUNCIONES DE SEGURIDAD =====
const validateSession = () => {
    try {
        const sessionStatus = sessionStorage.getItem("session");
        const isValid = sessionStatus === "ok";
        if (!isValid) {
            sessionStorage.removeItem("session");
            sessionStorage.removeItem("sessionData");
            window.location.href = "../../index.html";
            return false;
        }
        return true;
    } catch (error) {
        console.error("Error validando sesión:", error);
        return false;
    }
};

const closeSession = () => {
    try {
        sessionStorage.removeItem("session");
        sessionStorage.removeItem("sessionData");
        window.location.href = "../../index.html";
    } catch (error) {
        console.error("Error cerrando sesión:", error);
        sessionStorage.removeItem("session");
        sessionStorage.removeItem("sessionData");
        window.location.href = "../../index.html";
    }
};

// ===== FUNCIONES PARA CARGAR SELECTS =====

/**
 * Obtener todos los roles y cargar en el select
 */
const obtainRoles = async () => {
    try {
        if (!validateSession()) return;

        const response = await getData(ROLES_API);

        if (response && response.success !== false && response.data) {
            const roleSelect = document.getElementById("roleId");
            
            if (!roleSelect) {
                console.error("Elemento select de roles no encontrado");
                return;
            }

            roleSelect.innerHTML = '<option value="" selected disabled>Seleccione un rol</option>';
            
            response.data.forEach(role => {
                const option = document.createElement('option');
                option.value = role.roleId;
                option.textContent = role.roleName || role.name;
                roleSelect.appendChild(option);
            });

            console.log("Roles cargados correctamente");

        } else {
            const errorMsg = response?.message || "No se pudieron obtener los roles.";
            console.error(errorMsg);
        }
    } catch (error) {
        console.error("Error obteniendo roles:", error);
    }
};

/**
 * Obtener todos los usuarios y cargar en el select
 */
const obtainUsers = async () => {
    try {
        if (!validateSession()) return;

        const response = await getData(`${USERS_API}?onlyActive=true`);

        if (response && response.success !== false && response.data) {
            const userSelect = document.getElementById("userId");
            
            if (!userSelect) {
                console.error("Elemento select de usuarios no encontrado");
                return;
            }

            userSelect.innerHTML = '<option value="">Seleccione un usuario (opcional)</option>';
            
            response.data.forEach(user => {
                const option = document.createElement('option');
                option.value = user.userId;
                option.textContent = `${user.name} (${user.email})`;
                userSelect.appendChild(option);
            });

            console.log("Usuarios cargados correctamente");

        } else {
            const errorMsg = response?.message || "No se pudieron obtener los usuarios.";
            console.error(errorMsg);
        }
    } catch (error) {
        console.error("Error obteniendo usuarios:", error);
    }
};

/**
 * Obtener todos los empleados y cargar en el select
 */
const obtainEmployees = async () => {
    try {
        if (!validateSession()) return;

        const response = await getData(`${EMPLOYEES_API}?onlyActive=true`);

        if (response && response.success !== false && response.data) {
            const employeeSelect = document.getElementById("employeeId");
            
            if (!employeeSelect) {
                console.error("Elemento select de empleados no encontrado");
                return;
            }

            employeeSelect.innerHTML = '<option value="">Seleccione un empleado (opcional)</option>';
            
            response.data.forEach(employee => {
                const option = document.createElement('option');
                option.value = employee.employeeId;
                option.textContent = `${employee.personName || employee.name} (${employee.email})`;
                employeeSelect.appendChild(option);
            });

            console.log("Empleados cargados correctamente");

        } else {
            const errorMsg = response?.message || "No se pudieron obtener los empleados.";
            console.error(errorMsg);
        }
    } catch (error) {
        console.error("Error obteniendo empleados:", error);
    }
};

// ===== FUNCIONES CRUD DE AUTENTICACIÓN =====

/**
 * Crear nuevo registro de autenticación usando POST /api/v1/Auth/Register
 */
const createAuth = async () => {
    try {
        if (!validateSession()) return;

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const roleId = document.getElementById("roleId").value;
        const userId = document.getElementById("userId").value;
        const employeeId = document.getElementById("employeeId").value;
        const isActive = document.getElementById("isActive").checked;

        // Validaciones
        if (!username || !password || !roleId) {
            showError("Usuario, contraseña y rol son obligatorios.");
            return;
        }

        if (password !== confirmPassword) {
            showError("Las contraseñas no coinciden.");
            return;
        }

        if (password.length < 8) {
            showError("La contraseña debe tener al menos 8 caracteres.");
            return;
        }

        // Validar que no se envíen userId y employeeId a la vez
        if (userId && employeeId) {
            showError("No puede enviar UserId y EmployeeId a la vez. Seleccione solo uno o ninguno.");
            return;
        }

        // Preparar datos según la validación
        const authData = {
            username: username.trim(),
            password: password,
            roleId: parseInt(roleId),
            isActive: isActive
        };

        // Agregar userId o employeeId solo si tienen valor (no 0)
        if (userId && parseInt(userId) > 0) {
            authData.userId = parseInt(userId);
        } else if (employeeId && parseInt(employeeId) > 0) {
            authData.employeeId = parseInt(employeeId);
        }

        console.log("Enviando datos de registro:", authData);

        const response = await postData(AUTH_REGISTER_API, authData);

        if (response && response.success !== false) {
            showSuccess("Usuario autenticado creado correctamente");
            clearAuthForm();
        } else {
            showError(response?.message || "Error al crear usuario autenticado");
        }
    } catch (error) {
        console.error("Error creando usuario autenticado:", error);
        showError("Error al crear usuario autenticado: " + error.message);
    }
};

/**
 * Editar registro de autenticación - llenar formulario con datos existentes
 */
const editAuth = async (row) => {
    try {
        if (!validateSession()) return;

        // Llenar formulario con datos del registro
        document.getElementById("authId").value = row.userId || row.authUserId;
        document.getElementById("username").value = row.username || row.name || '';
        document.getElementById("roleId").value = row.roleId || '';
        document.getElementById("userId").value = row.userId || '';
        document.getElementById("employeeId").value = row.employeeId || '';
        document.getElementById("isActive").checked = row.isActive || false;

        // Ocultar campos de contraseña
        document.getElementById("password").closest('.col-12').style.display = 'none';
        document.getElementById("confirmPassword").closest('.col-12').style.display = 'none';

        // Mostrar botones apropiados
        document.getElementById("submitBtn").style.display = 'none';
        document.getElementById("updateBtn").style.display = 'block';
        document.getElementById("newPasswordBtn").style.display = 'block';

        // Scroll al formulario
        document.getElementById('authForm').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error("Error editando registro de autenticación:", error);
        showError("Error al cargar datos del registro: " + error.message);
    }
};

/**
 * Actualizar registro de autenticación existente usando PUT /api/v1/Auth
 */
const updateAuth = async () => {
    try {
        if (!validateSession()) return;

        const authId = document.getElementById("authId").value;
        const username = document.getElementById("username").value;
        const roleId = document.getElementById("roleId").value;
        const userId = document.getElementById("userId").value;
        const employeeId = document.getElementById("employeeId").value;
        const isActive = document.getElementById("isActive").checked;

        // Validaciones
        if (!authId) {
            showError("ID de autenticación no válido");
            return;
        }

        if (!username || !roleId) {
            showError("Usuario y rol son obligatorios.");
            return;
        }

        // Validar que no se envíen userId y employeeId a la vez
        if (userId && employeeId) {
            showError("No puede enviar UserId y EmployeeId a la vez. Seleccione solo uno o ninguno.");
            return;
        }

        // Preparar datos según la validación
        const authData = {
            authUserId: parseInt(authId),
            username: username.trim(),
            roleId: parseInt(roleId),
            isActive: isActive
        };

        // Agregar userId o employeeId solo si tienen valor (no 0)
        if (userId && parseInt(userId) > 0) {
            authData.userId = parseInt(userId);
        } else if (employeeId && parseInt(employeeId) > 0) {
            authData.employeeId = parseInt(employeeId);
        }

        console.log("Enviando datos de actualización:", authData);

        const response = await putData(AUTH_UPDATE_API, authData);

        if (response && response.success !== false) {
            showSuccess("Registro de autenticación actualizado correctamente");
            clearAuthForm();
        } else {
            showError(response?.message || "Error al actualizar registro");
        }
    } catch (error) {
        console.error("Error actualizando registro de autenticación:", error);
        showError("Error al actualizar registro: " + error.message);
    }
};

/**
 * Mostrar sección para cambiar contraseña
 */
const showChangePassword = async (row) => {
    try {
        if (!validateSession()) return;

        document.getElementById("changePasswordAuthId").value = row.authUserId || row.userId;
        document.getElementById("changePasswordSection").style.display = 'block';
        
        // Scroll a la sección de cambio de contraseña
        document.getElementById('changePasswordSection').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error("Error mostrando cambio de contraseña:", error);
        showError("Error al cargar cambio de contraseña: " + error.message);
    }
};

/**
 * Cambiar contraseña usando POST /api/v1/Auth/NewPassword
 */
const changePassword = async () => {
    try {
        if (!validateSession()) return;

        const authId = document.getElementById("changePasswordAuthId").value;
        const newPassword = document.getElementById("newPassword").value;
        const confirmNewPassword = document.getElementById("confirmNewPassword").value;

        // Validaciones
        if (!authId) {
            showError("ID de autenticación no válido");
            return;
        }

        if (!newPassword || !confirmNewPassword) {
            showError("Ambos campos de contraseña son obligatorios.");
            return;
        }

        if (newPassword !== confirmNewPassword) {
            showError("Las contraseñas no coinciden.");
            return;
        }

        if (newPassword.length < 8) {
            showError("La contraseña debe tener al menos 8 caracteres.");
            return;
        }

        const passwordData = {
            authUserId: parseInt(authId),
            newPassword: newPassword
        };

        console.log("Enviando cambio de contraseña:", passwordData);

        const response = await postData(AUTH_NEW_PASSWORD_API, passwordData);

        if (response && response.success !== false) {
            showSuccess("Contraseña cambiada correctamente");
            document.getElementById("changePasswordForm").reset();
            document.getElementById("changePasswordSection").style.display = 'none';
        } else {
            showError(response?.message || "Error al cambiar contraseña");
        }
    } catch (error) {
        console.error("Error cambiando contraseña:", error);
        showError("Error al cambiar contraseña: " + error.message);
    }
};

/**
 * Eliminar registro de autenticación con confirmación
 */
const deleteAuth = async (row) => {
    try {
        if (!validateSession()) return;

        const authId = row.authUserId || row.userId;
        const username = row.username || row.name;

        if (!authId) {
            showError("ID de autenticación no válido");
            return;
        }

        const confirmed = await showConfirmation(
            `¿Estás seguro de desactivar el usuario autenticado "${username}"?`,
            "Sí, desactivar",
            "Cancelar"
        );

        if (!confirmed) {
            return;
        }

        // Como no hay DELETE, actualizamos el estado a inactivo
        const authData = {
            authUserId: parseInt(authId),
            username: username,
            roleId: row.roleId,
            isActive: false
        };

        // Agregar userId o employeeId según corresponda
        if (row.userId && row.userId > 0) {
            authData.userId = row.userId;
        } else if (row.employeeId && row.employeeId > 0) {
            authData.employeeId = row.employeeId;
        }

        const response = await putData(AUTH_UPDATE_API, authData);

        if (response && response.success !== false) {
            showSuccess("Usuario autenticado desactivado correctamente");
        } else {
            showError(response?.message || "Error al desactivar usuario autenticado");
        }
    } catch (error) {
        console.error("Error desactivando usuario autenticado:", error);
        showError("Error al desactivar usuario autenticado: " + error.message);
    }
};

/**
 * Limpiar formulario de autenticación
 */
const clearAuthForm = () => {
    document.getElementById("authForm").reset();
    document.getElementById("authId").value = "";
    document.getElementById("isActive").checked = true;
    
    // Mostrar campos de contraseña
    document.getElementById("password").closest('.col-12').style.display = 'block';
    document.getElementById("confirmPassword").closest('.col-12').style.display = 'block';
    
    // Mostrar botones apropiados
    document.getElementById("submitBtn").style.display = 'block';
    document.getElementById("updateBtn").style.display = 'none';
    document.getElementById("newPasswordBtn").style.display = 'none';
    
    // Ocultar sección de cambio de contraseña
    document.getElementById("changePasswordSection").style.display = 'none';
};

// ===== ASIGNACIÓN DE FUNCIONES AL SCOPE GLOBAL =====
window.editAuth = editAuth;
window.deleteAuth = deleteAuth;
window.showChangePassword = showChangePassword;

// ===== INICIALIZACIÓN =====
document.addEventListener("DOMContentLoaded", async () => {
    // Validar sesión
    if (!validateSession()) return;
    
    // Inicializar menú dinámico
    initializeDynamicMenu();
    
    // Event Listeners
    const closeSessionBtn = document.getElementById("closeSession");
    if (closeSessionBtn) {
        closeSessionBtn.addEventListener("click", closeSession);
    }

    const authForm = document.getElementById("authForm");
    if (authForm) {
        authForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const authId = document.getElementById("authId").value;
            
            if (authId) {
                await updateAuth();
            } else {
                await createAuth();
            }
        });
    }

    const updateBtn = document.getElementById("updateBtn");
    if (updateBtn) {
        updateBtn.addEventListener("click", updateAuth);
    }

    const resetBtn = document.getElementById("resetBtn");
    if (resetBtn) {
        resetBtn.addEventListener("click", clearAuthForm);
    }

    const newPasswordBtn = document.getElementById("newPasswordBtn");
    if (newPasswordBtn) {
        newPasswordBtn.addEventListener("click", () => {
            const authId = document.getElementById("authId").value;
            if (authId) {
                const row = {
                    authUserId: parseInt(authId),
                    username: document.getElementById("username").value
                };
                showChangePassword(row);
            }
        });
    }

    const changePasswordForm = document.getElementById("changePasswordForm");
    if (changePasswordForm) {
        changePasswordForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            await changePassword();
        });
    }

    const cancelPasswordChange = document.getElementById("cancelPasswordChange");
    if (cancelPasswordChange) {
        cancelPasswordChange.addEventListener("click", () => {
            document.getElementById("changePasswordForm").reset();
            document.getElementById("changePasswordSection").style.display = 'none';
        });
    }

    // Cargar datos iniciales (solo los selects)
    try {
        await Promise.all([
            obtainRoles(),
            obtainUsers(),
            obtainEmployees()
        ]);
    } catch (error) {
        console.error("Error cargando datos iniciales:", error);
        showError("Error al cargar datos iniciales: " + error.message);
    }
});