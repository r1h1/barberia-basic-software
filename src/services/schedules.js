// Imports
import { SCHEDULES_API, SCHEDULES_GET_BY_ID_API, SCHEDULES_BY_EMPLOYEE_API, SCHEDULES_BY_DAY_API, EMPLOYEES_API } from "../config/constants.js";
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

// ===== FUNCIONES CRUD DE HORARIOS =====

/**
 * Obtener todos los empleados para el select
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

            // Limpiar opciones existentes (excepto la primera)
            employeeSelect.innerHTML = '<option value="" selected disabled>Seleccione un empleado</option>';
            
            // Agregar opciones de empleados
            response.data.forEach(employee => {
                const option = document.createElement('option');
                option.value = employee.employeeId;
                option.textContent = employee.name;
                employeeSelect.appendChild(option);
            });

            console.log("Empleados cargados correctamente");

        } else {
            showError(response?.message || "No se pudieron obtener los empleados.");
        }
    } catch (error) {
        console.error("Error obteniendo empleados:", error);
        showError(error.message || "Error al cargar empleados");
    }
};

/**
 * Obtener todos los horarios combinando datos de diferentes endpoints
 */
const obtainSchedules = async () => {
    try {
        if (!validateSession()) return;

        console.log("Obteniendo horarios...");
        
        // Estrategia: Obtener horarios por cada día de la semana y combinarlos
        let allSchedules = [];
        
        // Obtener empleados primero
        const employeesResponse = await getData(`${EMPLOYEES_API}?onlyActive=true`);
        
        if (employeesResponse && employeesResponse.success !== false && employeesResponse.data) {
            const employees = employeesResponse.data;
            
            // Para cada empleado, obtener sus horarios
            for (const employee of employees) {
                try {
                    const schedulesResponse = await getData(SCHEDULES_BY_EMPLOYEE_API(employee.employeeId));
                    
                    if (schedulesResponse && schedulesResponse.success !== false && schedulesResponse.data) {
                        // Agregar nombre del empleado a cada horario
                        const schedulesWithEmployeeName = schedulesResponse.data.map(schedule => ({
                            ...schedule,
                            employeeName: employee.name
                        }));
                        allSchedules = allSchedules.concat(schedulesWithEmployeeName);
                    }
                } catch (error) {
                    console.warn(`Error obteniendo horarios del empleado ${employee.employeeId}:`, error);
                }
            }
        }

        console.log("Horarios obtenidos:", allSchedules);
        
        // Inicializar DataTable con los horarios combinados
        initializeSchedulesTable(allSchedules);
        
    } catch (error) {
        console.error("Error obteniendo horarios:", error);
        showError("Error al cargar horarios: " + (error.message || "Servicio no disponible"));
        // Inicializar tabla vacía
        initializeSchedulesTable([]);
    }
};

/**
 * Inicializar DataTable con los horarios
 */
const initializeSchedulesTable = (schedulesData) => {
    $('#schedulesTable').DataTable({
        destroy: true,
        data: schedulesData,
        columns: [
            { data: "scheduleId", title: "ID" },
            { 
                data: "employeeName", 
                title: "Empleado",
                render: function(data) {
                    return data || '-';
                }
            },
            { 
                data: "dayOfWeek", 
                title: "Día",
                render: function(data) {
                    const days = {
                        1: 'Lunes',
                        2: 'Martes',
                        3: 'Miércoles',
                        4: 'Jueves',
                        5: 'Viernes',
                        6: 'Sábado',
                        7: 'Domingo'
                    };
                    return days[data] || data;
                }
            },
            { 
                data: null, 
                title: "Horario",
                render: function(data) {
                    const startTime = data.startTime ? data.startTime.substring(0, 5) : '-';
                    const endTime = data.endTime ? data.endTime.substring(0, 5) : '-';
                    return `${startTime} - ${endTime}`;
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
                        <button onclick='editSchedule(${JSON.stringify(row).replace(/'/g, "&#39;").replace(/"/g, "&quot;")})' 
                                class="btn btn-warning btn-sm mt-2">
                            <i class="bi bi-pencil"></i> Editar
                        </button>
                        <button onclick='deleteSchedule(${JSON.stringify(row).replace(/'/g, "&#39;").replace(/"/g, "&quot;")})' 
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
            emptyTable: schedulesData.length === 0 ? "No hay horarios registrados" : "",
            url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
        },
        pageLength: 10,
        responsive: true,
        order: [[0, 'desc']]
    });
};

/**
 * Crear nuevo horario
 */
const createSchedule = async () => {
    try {
        if (!validateSession()) return;

        const employeeId = document.getElementById("employeeId").value;
        const dayOfWeek = document.getElementById("dayOfWeek").value;
        const startTime = document.getElementById("startTime").value;
        const endTime = document.getElementById("endTime").value;
        const isActive = document.getElementById("isActive").checked;

        // Validaciones
        if (!employeeId || !dayOfWeek || !startTime || !endTime) {
            showError("Todos los campos son obligatorios.");
            return;
        }

        // Validar que la hora de fin sea mayor que la hora de inicio
        if (startTime >= endTime) {
            showError("La hora de fin debe ser mayor que la hora de inicio.");
            return;
        }

        const scheduleData = {
            ScheduleId: 0, // Para crear nuevo
            EmployeeId: parseInt(employeeId),
            DayOfWeek: parseInt(dayOfWeek),
            StartTime: startTime + ':00', // Formato HH:mm:ss
            EndTime: endTime + ':00', // Formato HH:mm:ss
            IsActive: isActive,
            Success: 0,
            Message: null
        };

        console.log("Datos enviados para crear:", scheduleData);

        const response = await postData(SCHEDULES_API, scheduleData);

        if (response && response.success !== false) {
            showSuccess("Horario creado correctamente");
            await obtainSchedules();
            clearScheduleForm();
        } else {
            showError(response?.message || "Error al crear horario");
        }
    } catch (error) {
        console.error("Error creando horario:", error);
        showError(error.message || "Error al crear horario");
    }
};

/**
 * Editar horario - llenar formulario con datos existentes
 */
const editSchedule = async (row) => {
    try {
        if (!validateSession()) return;

        // Llenar formulario con datos del horario
        document.getElementById("scheduleId").value = row.scheduleId;
        document.getElementById("employeeId").value = row.employeeId || '';
        document.getElementById("dayOfWeek").value = row.dayOfWeek || '';
        
        // Formatear horas (quitar segundos si existen)
        const startTime = row.startTime ? row.startTime.substring(0, 5) : '';
        const endTime = row.endTime ? row.endTime.substring(0, 5) : '';
        
        document.getElementById("startTime").value = startTime;
        document.getElementById("endTime").value = endTime;
        document.getElementById("isActive").checked = row.isActive || false;

        // Cambiar texto del botón
        document.getElementById("submitBtn").textContent = "Actualizar Horario";

        // Scroll al formulario
        document.getElementById('scheduleForm').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error("Error editando horario:", error);
        showError("Error al cargar datos del horario");
    }
};

/**
 * Actualizar horario existente
 */
const updateSchedule = async () => {
    try {
        if (!validateSession()) return;

        const scheduleId = document.getElementById("scheduleId").value;
        const employeeId = document.getElementById("employeeId").value;
        const dayOfWeek = document.getElementById("dayOfWeek").value;
        const startTime = document.getElementById("startTime").value;
        const endTime = document.getElementById("endTime").value;
        const isActive = document.getElementById("isActive").checked;

        // Validaciones
        if (!scheduleId) {
            showError("ID de horario no válido");
            return;
        }

        if (!employeeId || !dayOfWeek || !startTime || !endTime) {
            showError("Todos los campos son obligatorios.");
            return;
        }

        // Validar que la hora de fin sea mayor que la hora de inicio
        if (startTime >= endTime) {
            showError("La hora de fin debe ser mayor que la hora de inicio.");
            return;
        }

        const scheduleData = {
            ScheduleId: parseInt(scheduleId),
            EmployeeId: parseInt(employeeId),
            DayOfWeek: parseInt(dayOfWeek),
            StartTime: startTime + ':00', // Formato HH:mm:ss
            EndTime: endTime + ':00', // Formato HH:mm:ss
            IsActive: isActive,
            Success: 0,
            Message: null
        };

        console.log("Datos enviados para actualizar:", scheduleData);

        const response = await putData(SCHEDULES_API, scheduleData);

        if (response && response.success !== false) {
            showSuccess("Horario actualizado correctamente");
            await obtainSchedules();
            clearScheduleForm();
        } else {
            showError(response?.message || "Error al actualizar horario");
        }
    } catch (error) {
        console.error("Error actualizando horario:", error);
        showError(error.message || "Error al actualizar horario");
    }
};

/**
 * Eliminar horario con confirmación (eliminación lógica)
 */
const deleteSchedule = async (row) => {
    try {
        if (!validateSession()) return;

        const scheduleId = row.scheduleId;
        const employeeName = row.employeeName;
        const dayOfWeek = row.dayOfWeek;

        if (!scheduleId) {
            showError("ID de horario no válido");
            return;
        }

        const days = {
            1: 'Lunes',
            2: 'Martes', 
            3: 'Miércoles',
            4: 'Jueves',
            5: 'Viernes',
            6: 'Sábado',
            7: 'Domingo'
        };

        const dayName = days[dayOfWeek] || dayOfWeek;

        const confirmed = await showConfirmation(
            `¿Estás seguro de eliminar el horario de ${employeeName} para el ${dayName}?. Esta acción desactivará el horario del sistema.`,
            "Sí, eliminar",
            "Cancelar"
        );

        if (!confirmed) {
            return;
        }

        // Para DELETE, enviar los datos completos del horario
        const scheduleData = {
            ScheduleId: parseInt(scheduleId),
            EmployeeId: row.employeeId,
            DayOfWeek: row.dayOfWeek,
            StartTime: row.startTime,
            EndTime: row.endTime,
            IsActive: false, // Desactivar en lugar de eliminar
            Success: 0,
            Message: null
        };

        const response = await deleteData(SCHEDULES_GET_BY_ID_API(scheduleId), scheduleData);

        if (response === null || response?.success !== false) {
            showSuccess("Horario eliminado correctamente");
            await obtainSchedules();
        } else {
            showError(response?.message || "Error al eliminar horario");
        }
    } catch (error) {
        console.error("Error eliminando horario:", error);
        showError(error.message || "Error al eliminar horario");
    }
};

/**
 * Limpiar formulario de horario
 */
const clearScheduleForm = () => {
    document.getElementById("scheduleForm").reset();
    document.getElementById("scheduleId").value = "";
    document.getElementById("isActive").checked = true;
    document.getElementById("submitBtn").textContent = "Guardar Horario";
};

// ===== ASIGNACIÓN DE FUNCIONES AL SCOPE GLOBAL =====
window.editSchedule = editSchedule;
window.deleteSchedule = deleteSchedule;

// ===== INICIALIZACIÓN =====
document.addEventListener("DOMContentLoaded", async () => {
    // Validar sesión
    validateSession();

    // Event Listeners
    const closeSessionBtn = document.getElementById("closeSession");
    if (closeSessionBtn) {
        closeSessionBtn.addEventListener("click", closeSession);
    }

    const scheduleForm = document.getElementById("scheduleForm");
    if (scheduleForm) {
        scheduleForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const scheduleId = document.getElementById("scheduleId").value;
            
            if (scheduleId) {
                await updateSchedule();
            } else {
                await createSchedule();
            }
        });
    }

    const resetBtn = document.getElementById("resetBtn");
    if (resetBtn) {
        resetBtn.addEventListener("click", clearScheduleForm);
    }

    // Cargar datos iniciales
    await obtainEmployees();
    await obtainSchedules();
});