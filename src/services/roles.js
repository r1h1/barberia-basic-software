// Imports
import { ROLES_API, ROLES_GET_BY_ID_API } from "../config/constants.js";
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
};

// ===== FUNCIONES CRUD DE ROLES =====

/**
 * Obtener todos los roles y cargar en DataTable
 */
const obtainRoles = async () => {
    try {
        if (!validateSession()) return;

        const response = await getData(ROLES_API);

        if (response && response.success !== false && response.data) {
            // Inicializar DataTable
            $('#rolesTable').DataTable({
                destroy: true,
                data: response.data,
                columns: [
                    { data: "roleId", title: "ID" },
                    { data: "roleName", title: "Nombre del Rol" },
                    { 
                        data: "menuAccess", 
                        title: "Acceso a Menús",
                        render: function(data) {
                            if (!data) return '<span class="text-muted">Sin permisos</span>';
                            
                            const menus = data.split(',').filter(menu => menu.trim() !== '');
                            if (menus.length === 0) return '<span class="text-muted">Sin permisos</span>';
                            
                            return menus.map(menu => 
                                `<span class="badge bg-secondary me-2">${menu.trim()}</span>`
                            ).join('');
                        }
                    },
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
                                <button onclick='editRole(${JSON.stringify(row).replace(/'/g, "&#39;").replace(/"/g, "&quot;")})' 
                                        class="btn btn-warning btn-sm mt-2">
                                    <i class="bi bi-pencil"></i> Editar
                                </button>
                                <button onclick='deleteRole(${JSON.stringify(row).replace(/'/g, "&#39;").replace(/"/g, "&quot;")})' 
                                        class="btn btn-danger btn-sm mt-2">
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
                responsive: true,
                order: [[0, 'desc']]
            });
        } else {
            showError(response?.message || "No se pudieron obtener los roles.");
        }
    } catch (error) {
        console.error("Error obteniendo roles:", error);
        showError(error.message || "Error al cargar roles");
    }
};

/**
 * Crear nuevo rol
 */
const createRole = async () => {
    try {
        if (!validateSession()) return;

        const roleName = document.getElementById("roleName").value;
        const isActive = document.getElementById("isActive").checked;

        // Obtener permisos seleccionados
        const selectedPermissions = getSelectedPermissions();

        // Validaciones
        if (!roleName) {
            showError("El nombre del rol es obligatorio.");
            return;
        }

        if (selectedPermissions.length === 0) {
            showError("Debe seleccionar al menos un permiso de acceso.");
            return;
        }

        const roleData = {
            roleId: 0, // Para crear nuevo
            roleName: roleName.trim(),
            menuAccess: selectedPermissions.join(','),
            isActive: isActive,
            newRoleId: 0,
            success: 0,
            message: null
        };

        const response = await postData(ROLES_API, roleData);

        if (response && response.success !== false) {
            showSuccess("Rol creado correctamente");
            await obtainRoles();
            clearRoleForm();
        } else {
            showError(response?.message || "Error al crear rol");
        }
    } catch (error) {
        console.error("Error creando rol:", error);
        showError(error.message || "Error al crear rol");
    }
};

/**
 * Editar rol - llenar formulario con datos existentes
 */
const editRole = async (row) => {
    try {
        if (!validateSession()) return;

        // Llenar formulario con datos del rol
        document.getElementById("roleId").value = row.roleId;
        document.getElementById("roleName").value = row.roleName || '';
        document.getElementById("isActive").checked = row.isActive || false;

        // Cargar permisos existentes
        loadPermissionsFromData(row.menuAccess);

        // Cambiar texto del botón
        document.getElementById("submitBtn").textContent = "Actualizar Rol";

        // Scroll al formulario
        document.getElementById('roleForm').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error("Error editando rol:", error);
        showError("Error al cargar datos del rol");
    }
};

/**
 * Actualizar rol existente
 */
const updateRole = async () => {
    try {
        if (!validateSession()) return;

        const roleId = document.getElementById("roleId").value;
        const roleName = document.getElementById("roleName").value;
        const isActive = document.getElementById("isActive").checked;

        // Obtener permisos seleccionados
        const selectedPermissions = getSelectedPermissions();

        // Validaciones
        if (!roleId) {
            showError("ID de rol no válido");
            return;
        }

        if (!roleName) {
            showError("El nombre del rol es obligatorio.");
            return;
        }

        if (selectedPermissions.length === 0) {
            showError("Debe seleccionar al menos un permiso de acceso.");
            return;
        }

        const roleData = {
            roleId: parseInt(roleId),
            roleName: roleName.trim(),
            menuAccess: selectedPermissions.join(','),
            isActive: isActive,
            newRoleId: 0,
            success: 0,
            message: null
        };

        const response = await putData(ROLES_API, roleData);

        if (response && response.success !== false) {
            showSuccess("Rol actualizado correctamente");
            await obtainRoles();
            clearRoleForm();
        } else {
            showError(response?.message || "Error al actualizar rol");
        }
    } catch (error) {
        console.error("Error actualizando rol:", error);
        showError(error.message || "Error al actualizar rol");
    }
};

/**
 * Eliminar rol con confirmación (eliminación lógica)
 */
const deleteRole = async (row) => {
    try {
        if (!validateSession()) return;

        const roleId = row.roleId;
        const roleName = row.roleName;

        if (!roleId) {
            showError("ID de rol no válido");
            return;
        }

        const confirmed = await showConfirmation(
            `¿Estás seguro de eliminar el rol "${roleName}"?`,
            "Sí, eliminar",
            "Cancelar"
        );

        if (!confirmed) {
            return;
        }

        // Para DELETE, enviar los datos completos del rol
        const roleData = {
            roleId: parseInt(roleId),
            roleName: row.roleName,
            menuAccess: row.menuAccess,
            isActive: false, // Desactivar en lugar de eliminar
            newRoleId: 0,
            success: 0,
            message: null
        };

        const response = await deleteData(ROLES_GET_BY_ID_API(roleId), roleData);

        if (response === null || response?.success !== false) {
            showSuccess("Rol eliminado correctamente");
            await obtainRoles();
        } else {
            showError(response?.message || "Error al eliminar rol");
        }
    } catch (error) {
        console.error("Error eliminando rol:", error);
        showError(error.message || "Error al eliminar rol");
    }
};

/**
 * Obtener permisos seleccionados
 */
const getSelectedPermissions = () => {
    const checkboxes = document.querySelectorAll('.menu-access:checked');
    const permissions = Array.from(checkboxes).map(checkbox => checkbox.value);
    return permissions;
};

/**
 * Cargar permisos desde datos existentes
 */
const loadPermissionsFromData = (menuAccess) => {
    // Limpiar todos los checkboxes primero
    const allCheckboxes = document.querySelectorAll('.menu-access');
    allCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });

    if (!menuAccess) return;

    // Marcar los checkboxes correspondientes
    const permissions = menuAccess.split(',').map(perm => perm.trim());
    permissions.forEach(permission => {
        const checkbox = document.querySelector(`.menu-access[value="${permission}"]`);
        if (checkbox) {
            checkbox.checked = true;
        }
    });
};

/**
 * Limpiar formulario de rol
 */
const clearRoleForm = () => {
    document.getElementById("roleForm").reset();
    document.getElementById("roleId").value = "";
    document.getElementById("isActive").checked = true;
    
    // Limpiar checkboxes de permisos
    const allCheckboxes = document.querySelectorAll('.menu-access');
    allCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    document.getElementById("submitBtn").textContent = "Guardar Rol";
};

// ===== ASIGNACIÓN DE FUNCIONES AL SCOPE GLOBAL =====
window.editRole = editRole;
window.deleteRole = deleteRole;

// ===== INICIALIZACIÓN =====
document.addEventListener("DOMContentLoaded", async () => {
    // Validar sesión
    validateSession();

    // Event Listeners
    const closeSessionBtn = document.getElementById("closeSession");
    if (closeSessionBtn) {
        closeSessionBtn.addEventListener("click", closeSession);
    }

    const roleForm = document.getElementById("roleForm");
    if (roleForm) {
        roleForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const roleId = document.getElementById("roleId").value;
            
            if (roleId) {
                await updateRole();
            } else {
                await createRole();
            }
        });
    }

    const resetBtn = document.getElementById("resetBtn");
    if (resetBtn) {
        resetBtn.addEventListener("click", clearRoleForm);
    }

    // Cargar datos iniciales
    await obtainRoles();
});