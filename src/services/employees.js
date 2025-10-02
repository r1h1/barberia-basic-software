// Imports
import { EMPLOYEES_API, EMPLOYEES_GET_BY_ID_API } from "../config/constants.js";
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

// ===== FUNCIONES CRUD DE EMPLEADOS =====

/**
 * Obtener todos los empleados y cargar en DataTable
 */
const obtainEmployees = async () => {
    try {
        if (!validateSession()) return;

        const response = await getData(`${EMPLOYEES_API}?onlyActive=true`);

        if (response && response.success !== false && response.data) {
            // Inicializar DataTable
            $('#employeesTable').DataTable({
                destroy: true,
                data: response.data,
                columns: [
                    { data: "employeeId", title: "ID" },
                    { data: "name", title: "Nombre" },
                    { data: "email", title: "Email" },
                    { data: "phone", title: "Teléfono" },
                    { data: "cui", title: "CUI" },
                    { data: "specialty", title: "Especialidad" },
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
                                <button onclick='editEmployee(${JSON.stringify(row).replace(/'/g, "&#39;").replace(/"/g, "&quot;")})' 
                                        class="btn btn-warning btn-sm mt-2">
                                    <i class="bi bi-pencil"></i> Editar
                                </button>
                                <button onclick='deleteEmployee(${JSON.stringify(row).replace(/'/g, "&#39;").replace(/"/g, "&quot;")})' 
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
            showError(response?.message || "No se pudieron obtener los empleados.");
        }
    } catch (error) {
        console.error("Error obteniendo empleados:", error);
        showError(error.message || "Error al cargar empleados");
    }
};

/**
 * Crear nuevo empleado
 */
const createEmployee = async () => {
    try {
        if (!validateSession()) return;

        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const phone = document.getElementById("phone").value;
        const cui = document.getElementById("cui").value;
        const specialty = document.getElementById("specialty").value;
        const isActive = document.getElementById("isActive").checked;

        // Validaciones
        if (!name || !email || !phone || !cui || !specialty) {
            showError("Todos los campos son obligatorios.");
            return;
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError("Por favor ingrese un email válido.");
            return;
        }

        const employeeData = {
            employeeId: 0, // Para crear nuevo
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            cui: cui.trim(),
            specialty: specialty,
            isActive: isActive,
            success: 0,
            message: null
        };

        const response = await postData(EMPLOYEES_API, employeeData);

        if (response && response.success !== false) {
            showSuccess("Empleado creado correctamente");
            await obtainEmployees();
            clearEmployeeForm();
        } else {
            showError(response?.message || "Error al crear empleado");
        }
    } catch (error) {
        console.error("Error creando empleado:", error);
        showError(error.message || "Error al crear empleado");
    }
};

/**
 * Editar empleado - llenar formulario con datos existentes
 */
const editEmployee = async (row) => {
    try {
        if (!validateSession()) return;

        // Llenar formulario con datos del empleado
        document.getElementById("employeeId").value = row.employeeId;
        document.getElementById("name").value = row.name || '';
        document.getElementById("email").value = row.email || '';
        document.getElementById("phone").value = row.phone || '';
        document.getElementById("cui").value = row.cui || '';
        document.getElementById("specialty").value = row.specialty || '';
        document.getElementById("isActive").checked = row.isActive || false;

        // Cambiar texto del botón
        document.getElementById("submitBtn").textContent = "Actualizar Empleado";

        // Scroll al formulario
        document.getElementById('employeeForm').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error("Error editando empleado:", error);
        showError("Error al cargar datos del empleado");
    }
};

/**
 * Actualizar empleado existente
 */
const updateEmployee = async () => {
    try {
        if (!validateSession()) return;

        const employeeId = document.getElementById("employeeId").value;
        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const phone = document.getElementById("phone").value;
        const cui = document.getElementById("cui").value;
        const specialty = document.getElementById("specialty").value;
        const isActive = document.getElementById("isActive").checked;

        // Validaciones
        if (!employeeId) {
            showError("ID de empleado no válido");
            return;
        }

        if (!name || !email || !phone || !cui || !specialty) {
            showError("Todos los campos son obligatorios.");
            return;
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError("Por favor ingrese un email válido.");
            return;
        }

        const employeeData = {
            employeeId: parseInt(employeeId),
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            cui: cui.trim(),
            specialty: specialty,
            isActive: isActive,
            success: 0,
            message: null
        };

        const response = await putData(EMPLOYEES_API, employeeData);

        if (response && response.success !== false) {
            showSuccess("Empleado actualizado correctamente");
            await obtainEmployees();
            clearEmployeeForm();
        } else {
            showError(response?.message || "Error al actualizar empleado");
        }
    } catch (error) {
        console.error("Error actualizando empleado:", error);
        showError(error.message || "Error al actualizar empleado");
    }
};

/**
 * Eliminar empleado con confirmación (eliminación lógica)
 */
const deleteEmployee = async (row) => {
    try {
        if (!validateSession()) return;

        const employeeId = row.employeeId;
        const employeeName = row.name;

        if (!employeeId) {
            showError("ID de empleado no válido");
            return;
        }

        const confirmed = await showConfirmation(
            `¿Estás seguro de eliminar al empleado "${employeeName}"?`,
            "Esta acción desactivará al empleado del sistema.",
            "Sí, eliminar",
            "Cancelar"
        );

        if (!confirmed) {
            return;
        }

        // Para DELETE, enviar los datos completos del empleado
        const employeeData = {
            employeeId: parseInt(employeeId),
            name: row.name,
            email: row.email,
            phone: row.phone,
            cui: row.cui,
            specialty: row.specialty,
            isActive: false, // Desactivar en lugar de eliminar
            success: 0,
            message: null
        };

        const response = await deleteData(EMPLOYEES_GET_BY_ID_API(employeeId), employeeData);

        if (response === null || response?.success !== false) {
            showSuccess("Empleado eliminado correctamente");
            await obtainEmployees();
        } else {
            showError(response?.message || "Error al eliminar empleado");
        }
    } catch (error) {
        console.error("Error eliminando empleado:", error);
        showError(error.message || "Error al eliminar empleado");
    }
};

/**
 * Limpiar formulario de empleado
 */
const clearEmployeeForm = () => {
    document.getElementById("employeeForm").reset();
    document.getElementById("employeeId").value = "";
    document.getElementById("isActive").checked = true;
    document.getElementById("submitBtn").textContent = "Guardar Empleado";
};

// ===== ASIGNACIÓN DE FUNCIONES AL SCOPE GLOBAL =====
window.editEmployee = editEmployee;
window.deleteEmployee = deleteEmployee;

// ===== INICIALIZACIÓN =====
document.addEventListener("DOMContentLoaded", async () => {
    // Validar sesión
    validateSession();

    // Event Listeners
    const closeSessionBtn = document.getElementById("closeSession");
    if (closeSessionBtn) {
        closeSessionBtn.addEventListener("click", closeSession);
    }

    const employeeForm = document.getElementById("employeeForm");
    if (employeeForm) {
        employeeForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const employeeId = document.getElementById("employeeId").value;
            
            if (employeeId) {
                await updateEmployee();
            } else {
                await createEmployee();
            }
        });
    }

    const resetBtn = document.getElementById("resetBtn");
    if (resetBtn) {
        resetBtn.addEventListener("click", clearEmployeeForm);
    }

    // Cargar datos iniciales
    await obtainEmployees();
});