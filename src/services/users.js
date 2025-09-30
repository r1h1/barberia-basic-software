// Imports
import { USERS_API, USERS_GET_BY_ID_API, ROLES_API } from "../config/constants.js";
import { getData, postData, putData, deleteData } from "../data/methods.js";
import { showError, showSuccess, showConfirmation } from "../utils/sweetAlert.js";

// ===== FUNCIONES DE SEGURIDAD =====
const validateSession = () => {
    try {
        const sessionStatus = sessionStorage.getItem("session");
        const isValid = sessionStatus === "ok";
        if (!isValid) {
            sessionStorage.removeItem("session");
            window.location.href = "../../index.html";
            return false;
        }
        return true;
    } catch (error) {
        showError("Error validando sesión: " + error);
        return false;
    }
};

const closeSession = () => {
    try {
        const sessionStatus = sessionStorage.getItem("session");
        const isValid = sessionStatus === "ok";
        if (isValid) {
            sessionStorage.removeItem("session");
            window.location.href = "../../index.html";
        }
        return true;
    } catch (error) {
        showError("Error cerrando sesión: " + error);
        sessionStorage.removeItem("session");
        window.location.href = "../../index.html";
    }
}

// ===== FUNCIONES CRUD DE USUARIOS =====

/**
 * Obtener todos los roles y cargar en el select
 */
const obtainRoles = async () => {
    try {
        if (!validateSession()) return;

        const response = await getData(ROLES_API);

        if (response && response.success !== false && response.data) {
            const roleSelect = document.getElementById("role");
            
            if (!roleSelect) {
                console.error("Elemento select de roles no encontrado");
                return;
            }

            // Limpiar opciones existentes (excepto la primera)
            roleSelect.innerHTML = '<option value="" selected disabled>Seleccione un rol</option>';
            
            // Agregar opciones de roles
            response.data.forEach(role => {
                const option = document.createElement('option');
                option.value = role.roleId; // Usar roleId de la API
                option.textContent = role.name || role.roleName; // Depende del campo en tu API
                roleSelect.appendChild(option);
            });

            console.log("Roles cargados correctamente");

        } else {
            showError(response?.message || "No se pudieron obtener los roles.");
        }
    } catch (error) {
        console.error("Error obteniendo roles:", error);
        showError(error.message || "Error al cargar roles");
    }
}

/**
 * Obtener todos los usuarios y cargar en DataTable
 */
const obtainUsers = async () => {
    try {
        if (!validateSession()) return;

        // Obtener usuarios activos
        const response = await getData(`${USERS_API}?onlyActive=true`);

        if (response && response.success !== false && response.data) {
            // Inicializar DataTable
            $('#usersTable').DataTable({
                destroy: true,
                data: response.data,
                columns: [
                    { data: "userId", title: "ID" },
                    { data: "name", title: "Nombre" },
                    { data: "email", title: "Email" },
                    { data: "phone", title: "Teléfono" },
                    { data: "role", title: "Rol" },
                    { 
                        data: "isActive", 
                        title: "Estado",
                        render: function(data) {
                            return data ? 
                                '<span class="badge bg-success">Activo</span>' : 
                                '<span class="badge bg-secondary">Inactivo</span>';
                        }
                    },
                    {
                        data: null,
                        title: "Acciones",
                        render: function (data, type, row) {
                            return `
                                <button onclick='editUser(${JSON.stringify(row).replace(/'/g, "&#39;").replace(/"/g, "&quot;")})' 
                                        class="btn btn-warning btn-sm">
                                    <i class="bi bi-pencil"></i> Editar
                                </button>
                                <button onclick='deleteUser(${JSON.stringify(row).replace(/'/g, "&#39;").replace(/"/g, "&quot;")})' 
                                        class="btn btn-danger btn-sm">
                                    <i class="bi bi-trash"></i> Eliminar
                                </button>
                            `;
                        }
                    }
                ],
                dom: 'Bfrtip',
                buttons: [
                    {
                        extend: 'copy',
                        className: 'btn btn-secondary'
                    },
                    {
                        extend: 'excel',
                        className: 'btn btn-secondary'
                    },
                    {
                        extend: 'pdf',
                        className: 'btn btn-secondary'
                    },
                    {
                        extend: 'print',
                        className: 'btn btn-secondary'
                    }
                ],
                language: {
                    url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
                },
                pageLength: 10,
                responsive: true
            });
        } else {
            showError(response?.message || "No se pudieron obtener los usuarios.");
        }
    } catch (error) {
        console.error("Error obteniendo usuarios:", error);
        showError(error.message || "Error al cargar usuarios");
    }
}

/**
 * Crear nuevo usuario
 */
const createUser = async () => {
    try {
        if (!validateSession()) return;

        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const phone = document.getElementById("phone").value;
        const role = document.getElementById("role").value;
        const isActive = document.getElementById("isActive").checked;

        // Validaciones
        if (!name || !email || !role) {
            showError("Nombre, email y rol son obligatorios.");
            return;
        }

        const userData = {
            userId: 0, // Para crear nuevo
            name: name.trim(),
            email: email.trim(),
            phone: phone?.trim() || "",
            role: role,
            isActive: isActive,
            success: 0,
            message: null
        };

        const response = await postData(USERS_API, userData);

        if (response && response.success !== false) {
            showSuccess("Usuario creado correctamente");
            await obtainUsers();
            clearUserForm();
        } else {
            showError(response?.message || "Error al crear usuario");
        }
    } catch (error) {
        console.error("Error creando usuario:", error);
        showError(error.message || "Error al crear usuario");
    }
}

/**
 * Editar usuario - llenar formulario con datos existentes
 */
const editUser = async (row) => {
    try {
        if (!validateSession()) return;

        // Llenar formulario con datos del usuario
        document.getElementById("userId").value = row.userId;
        document.getElementById("name").value = row.name || '';
        document.getElementById("email").value = row.email || '';
        document.getElementById("phone").value = row.phone || '';
        document.getElementById("role").value = row.role || '';
        document.getElementById("isActive").checked = row.isActive || false;

        // Cambiar texto del botón
        document.getElementById("submitBtn").textContent = "Actualizar Usuario";

        // Scroll al formulario
        document.getElementById('userForm').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error("Error editando usuario:", error);
        showError("Error al cargar datos del usuario");
    }
}

/**
 * Actualizar usuario existente
 */
const updateUser = async () => {
    try {
        if (!validateSession()) return;

        const userId = document.getElementById("userId").value;
        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const phone = document.getElementById("phone").value;
        const role = document.getElementById("role").value;
        const isActive = document.getElementById("isActive").checked;

        // Validaciones
        if (!userId) {
            showError("ID de usuario no válido");
            return;
        }

        if (!name || !email || !role) {
            showError("Nombre, email y rol son obligatorios.");
            return;
        }

        const userData = {
            userId: parseInt(userId),
            name: name.trim(),
            email: email.trim(),
            phone: phone?.trim() || "",
            role: role,
            isActive: isActive,
            success: 0,
            message: null
        };

        const response = await putData(USERS_API, userData);

        if (response && response.success !== false) {
            showSuccess("Usuario actualizado correctamente");
            await obtainUsers();
            clearUserForm();
        } else {
            showError(response?.message || "Error al actualizar usuario");
        }
    } catch (error) {
        console.error("Error actualizando usuario:", error);
        showError(error.message || "Error al actualizar usuario");
    }
}

/**
 * Eliminar usuario con confirmación (eliminación lógica)
 */
const deleteUser = async (row) => {
    try {
        if (!validateSession()) return;

        const userId = row.userId;
        const userName = row.name;

        if (!userId) {
            showError("ID de usuario no válido");
            return;
        }

        const confirmed = await showConfirmation(
            `¿Estás seguro de eliminar al usuario "${userName}"?`,
            "Sí, eliminar",
            "Cancelar"
        );

        if (!confirmed) {
            return;
        }

        // Para DELETE, enviar los datos completos del usuario
        const userData = {
            userId: parseInt(userId),
            name: row.name,
            email: row.email,
            phone: row.phone || "",
            role: row.role,
            isActive: false, // Desactivar en lugar de eliminar
            success: 0,
            message: null
        };

        const response = await deleteData(USERS_GET_BY_ID_API(userId), userData);

        if (response === null || response?.success !== false) {
            showSuccess("Usuario eliminado correctamente");
            await obtainUsers();
        } else {
            showError(response?.message || "Error al eliminar usuario");
        }
    } catch (error) {
        console.error("Error eliminando usuario:", error);
        showError(error.message || "Error al eliminar usuario");
    }
}

/**
 * Limpiar formulario de usuario
 */
const clearUserForm = () => {
    document.getElementById("userForm").reset();
    document.getElementById("userId").value = "";
    document.getElementById("isActive").checked = true;
    document.getElementById("submitBtn").textContent = "Guardar Usuario";
}

// ===== ASIGNACIÓN DE FUNCIONES AL SCOPE GLOBAL =====
window.editUser = editUser;
window.deleteUser = deleteUser;

// ===== INICIALIZACIÓN =====
document.addEventListener("DOMContentLoaded", async () => {
    // Validar sesión
    validateSession();

    // Event Listeners
    const closeSessionBtn = document.getElementById("closeSession");
    if (closeSessionBtn) {
        closeSessionBtn.addEventListener("click", closeSession);
    }

    const userForm = document.getElementById("userForm");
    if (userForm) {
        userForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const userId = document.getElementById("userId").value;
            
            if (userId) {
                await updateUser();
            } else {
                await createUser();
            }
        });
    }

    const resetBtn = document.getElementById("resetBtn");
    if (resetBtn) {
        resetBtn.addEventListener("click", clearUserForm);
    }

    // Cargar datos iniciales
    await obtainUsers();
    await obtainRoles();
});