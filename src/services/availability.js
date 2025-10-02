// Imports
import { 
    AVAILABILITY_API, 
    AVAILABILITY_EMPLOYEES_WITH_SLOTS_API, 
    AVAILABILITY_CHECK_API, 
    AVAILABILITY_EMPLOYEE_APPOINTMENTS_API, 
    AVAILABILITY_SERVICES_API, 
    AVAILABILITY_QUICK_CHECK_API,
    EMPLOYEES_API,
    SERVICES_API,
    SCHEDULES_BY_EMPLOYEE_API
} from "../config/constants.js";
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

// ===== VARIABLES GLOBALES =====
let selectedEmployee = null;
let selectedDate = new Date();
let selectedTimeSlot = null;
let selectedService = null;
let employeesData = [];
let employeeSchedules = {}; // Almacenar horarios por empleado

// ===== FUNCIONES PRINCIPALES =====

/**
 * Obtener empleados y sus horarios
 */
const obtainEmployeesWithSchedules = async () => {
    try {
        if (!validateSession()) return;

        console.log("Obteniendo empleados y sus horarios...");
        
        // 1. Obtener lista de empleados
        const employeesResponse = await getData(`${EMPLOYEES_API}?onlyActive=true`);
        
        if (employeesResponse && employeesResponse.success !== false && employeesResponse.data) {
            employeesData = employeesResponse.data;
            
            // 2. Para cada empleado, obtener sus horarios programados
            for (const employee of employeesData) {
                try {
                    const schedulesResponse = await getData(SCHEDULES_BY_EMPLOYEE_API(employee.employeeId));
                    
                    if (schedulesResponse && schedulesResponse.success !== false && schedulesResponse.data) {
                        employeeSchedules[employee.employeeId] = schedulesResponse.data;
                        console.log(`Horarios cargados para ${employee.name}:`, schedulesResponse.data);
                    } else {
                        employeeSchedules[employee.employeeId] = [];
                        console.log(`No hay horarios programados para ${employee.name}`);
                    }
                } catch (error) {
                    console.warn(`Error obteniendo horarios de ${employee.name}:`, error);
                    employeeSchedules[employee.employeeId] = [];
                }
            }
            
            // 3. Cargar empleados en la interfaz
            loadEmployees(employeesData);
            populateEmployeeSelect(employeesData);
            
        } else {
            showError("No se pudieron cargar los empleados");
        }
    } catch (error) {
        console.error("Error obteniendo empleados:", error);
        showError("Error al cargar empleados");
    }
};

/**
 * Cargar empleados en la interfaz
 */
const loadEmployees = (employeesData) => {
    const container = document.getElementById('employeesContainer');
    if (!container) {
        console.error("Contenedor de empleados no encontrado");
        return;
    }

    container.innerHTML = '';

    employeesData.forEach(employee => {
        // Verificar disponibilidad para el día actual
        const dayOfWeek = selectedDate.getDay(); // 0=Domingo, 1=Lunes, etc.
        const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek; // Ajustar para que 1=Lunes, 7=Domingo
        
        const todaySchedule = employeeSchedules[employee.employeeId]?.find(
            schedule => schedule.dayOfWeek === adjustedDayOfWeek && schedule.isActive
        );

        const isAvailableToday = !!todaySchedule;
        
        const employeeCard = `
            <div class="col-md-4 mb-3">
                <div class="card employee-card ${selectedEmployee === employee.employeeId ? 'border-primary selected' : ''} 
                     ${!isAvailableToday ? 'bg-light' : ''}" 
                     data-employee-id="${employee.employeeId}">
                    <div class="card-body text-center">
                        <h5 class="card-title">${employee.name}</h5>
                        <p class="card-text text-muted small">${employee.specialty || 'Sin Especialidad'}</p>
                        <div class="availability-info">
                            ${isAvailableToday ? 
                                `<span class="badge bg-success">
                                    <i class="bi bi-check-circle me-1"></i>Disponible hoy
                                </span>` :
                                `<span class="badge bg-secondary">
                                    <i class="bi bi-x-circle me-1"></i>No disponible hoy
                                </span>`
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += employeeCard;
    });

    // Agregar event listeners a las tarjetas
    document.querySelectorAll('.employee-card').forEach(card => {
        card.addEventListener('click', handleEmployeeSelection);
    });
};

/**
 * Llenar select de empleados en filtros avanzados
 */
const populateEmployeeSelect = (employeesData) => {
    const employeeSelect = document.getElementById('employeeSelect');
    if (!employeeSelect) return;

    employeeSelect.innerHTML = '<option value="" selected>Todos los barberos</option>';

    employeesData.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.employeeId;
        option.textContent = employee.name;
        employeeSelect.appendChild(option);
    });
};

/**
 * Manejar selección de empleado
 */
const handleEmployeeSelection = (event) => {
    const card = event.currentTarget;
    const employeeId = parseInt(card.dataset.employeeId);

    // Verificar si el empleado está disponible hoy
    const dayOfWeek = selectedDate.getDay();
    const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
    const todaySchedule = employeeSchedules[employeeId]?.find(
        schedule => schedule.dayOfWeek === adjustedDayOfWeek && schedule.isActive
    );

    if (!todaySchedule) {
        showError("Este barbero no está disponible hoy. Por favor seleccione otro día u otro barbero.");
        return;
    }

    selectedEmployee = employeeId;

    // Remover selección anterior
    document.querySelectorAll('.employee-card').forEach(c => {
        c.classList.remove('border-primary', 'selected');
    });

    // Agregar selección actual
    card.classList.add('border-primary', 'selected');

    // Cargar horarios y citas del empleado seleccionado
    loadTimeSlotsForEmployee(employeeId);
    loadEmployeeAppointments(employeeId);
};

/**
 * Obtener servicios disponibles
 */
const obtainServices = async () => {
    try {
        if (!validateSession()) return;

        const response = await getData(AVAILABILITY_SERVICES_API);

        if (response && response.success !== false && response.data) {
            populateServicesSelect(response.data);
        } else {
            // Fallback: obtener servicios del endpoint general
            const fallbackResponse = await getData(`${SERVICES_API}?onlyActive=true`);
            if (fallbackResponse && fallbackResponse.success !== false && fallbackResponse.data) {
                populateServicesSelect(fallbackResponse.data);
            }
        }
    } catch (error) {
        console.error("Error obteniendo servicios:", error);
    }
};

/**
 * Llenar select de servicios
 */
const populateServicesSelect = (servicesData) => {
    const quickServiceSelect = document.getElementById('quickService');
    if (!quickServiceSelect) return;

    // Limpiar opciones excepto la primera
    quickServiceSelect.innerHTML = '<option value="" selected disabled>Seleccione un servicio</option>';

    servicesData.forEach(service => {
        const option = document.createElement('option');
        option.value = service.serviceId;
        option.textContent = `${service.name} (${service.durationMin} min)`;
        quickServiceSelect.appendChild(option);
    });
};

/**
 * Cargar horarios para un empleado específico basado en su programación real
 */
const loadTimeSlotsForEmployee = async (employeeId) => {
    try {
        if (!validateSession()) return;

        const dayOfWeek = selectedDate.getDay();
        const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
        
        // Buscar el horario programado para este día
        const daySchedule = employeeSchedules[employeeId]?.find(
            schedule => schedule.dayOfWeek === adjustedDayOfWeek && schedule.isActive
        );

        if (!daySchedule) {
            showError("No hay horario programado para este barbero en el día seleccionado.");
            generateEmptyTimeSlots();
            return;
        }

        // Generar slots basados en el horario real del empleado
        generateRealTimeSlots(daySchedule, employeeId);
        
        // Verificar disponibilidad con el API (opcional)
        await checkAvailabilityWithAPI(employeeId);

    } catch (error) {
        console.error("Error cargando horarios:", error);
        generateEmptyTimeSlots();
    }
};

/**
 * Verificar disponibilidad con el API
 */
const checkAvailabilityWithAPI = async (employeeId) => {
    try {
        const today = selectedDate.toISOString().split('T')[0];
        const availabilityData = {
            EmployeeId: employeeId,
            Date: today + 'T00:00:00.000Z',
            StartTime: "08:00"
        };

        const response = await postData(AVAILABILITY_CHECK_API, availabilityData);
        
        if (response && response.success !== false && response.data) {
            console.log("Disponibilidad del API:", response.data);
            // Aquí podrías actualizar los slots con datos reales del API
        }
    } catch (error) {
        console.warn("No se pudo verificar disponibilidad con el API:", error);
    }
};

/**
 * Generar slots basados en el horario real del empleado
 */
const generateRealTimeSlots = (daySchedule, employeeId) => {
    const container = document.getElementById('timeSlotsContainer');
    const dateDisplay = document.getElementById('currentDateDisplay');
    
    if (!container || !dateDisplay) return;

    // Actualizar display de fecha
    dateDisplay.textContent = formatDate(selectedDate);
    
    container.innerHTML = '';

    const startTime = daySchedule.startTime.substring(0, 5); // "07:00"
    const endTime = daySchedule.endTime.substring(0, 5);     // "20:00"
    
    const timeSlots = generateTimeSlotsFromRange(startTime, endTime);
    
    // Obtener citas existentes para este empleado en esta fecha
    const existingAppointments = getExistingAppointmentsForDate(employeeId, selectedDate);

    timeSlots.forEach(slot => {
        // Verificar si el slot está ocupado por una cita existente
        const isBooked = existingAppointments.some(apt => 
            apt.startTime.substring(0, 5) === slot
        );
        
        const slotElement = `
            <div class="col-6 col-md-4 col-lg-3 mb-2">
                <div class="time-slot card ${isBooked ? 'booked border-danger bg-light' : 'available border-success'} 
                     ${selectedTimeSlot === slot ? 'selected border-primary' : ''}" 
                     data-time="${slot}" onclick="handleTimeSlotSelection('${slot}', ${!isBooked})">
                    <div class="card-body text-center p-2">
                        <div class="fw-bold">${slot}</div>
                        <small class="${isBooked ? 'text-danger' : 'text-success'}">
                            <i class="bi ${isBooked ? 'bi-x-circle' : 'bi-check-circle'} me-1"></i>
                            ${isBooked ? 'Ocupado' : 'Disponible'}
                        </small>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += slotElement;
    });
};

/**
 * Generar slots vacíos cuando no hay disponibilidad
 */
const generateEmptyTimeSlots = () => {
    const container = document.getElementById('timeSlotsContainer');
    const dateDisplay = document.getElementById('currentDateDisplay');
    
    if (!container || !dateDisplay) return;

    dateDisplay.textContent = formatDate(selectedDate);
    container.innerHTML = `
        <div class="col-12 text-center py-4">
            <h5 class="text-muted mt-3">No hay horarios disponibles para este día</h5>
            <p class="text-muted">Seleccione otro día o consulte con otro barbero.</p>
        </div>
    `;
};

/**
 * Generar array de horarios dentro de un rango específico
 */
const generateTimeSlotsFromRange = (startTime, endTime) => {
    const slots = [];
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        slots.push(timeString);
        
        // Incrementar 30 minutos
        currentMinute += 30;
        if (currentMinute >= 60) {
            currentHour += 1;
            currentMinute = 0;
        }
    }
    
    return slots;
};

/**
 * Obtener citas existentes para un empleado en una fecha específica
 */
const getExistingAppointmentsForDate = async (employeeId, date) => {
    try {
        const response = await getData(AVAILABILITY_EMPLOYEE_APPOINTMENTS_API(employeeId));
        
        if (response && response.success !== false && response.data) {
            const dateString = date.toISOString().split('T')[0];
            return response.data.filter(apt => 
                apt.date.startsWith(dateString)
            );
        }
    } catch (error) {
        console.error("Error obteniendo citas existentes:", error);
    }
    return [];
};

/**
 * Formatear fecha
 */
const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

/**
 * Manejar selección de horario
 */
const handleTimeSlotSelection = (time, isAvailable) => {
    if (!isAvailable) {
        showError("Este horario no está disponible. Por favor seleccione otro.");
        return;
    }

    selectedTimeSlot = time;

    // Remover selección anterior
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('border-primary', 'selected');
    });

    // Agregar selección actual
    event.currentTarget.classList.add('border-primary', 'selected');

    // Mostrar opciones de reserva si hay empleado seleccionado
    if (selectedEmployee) {
        showBookingOptions();
    }
};

/**
 * Obtener citas de un empleado
 */
const loadEmployeeAppointments = async (employeeId) => {
    try {
        if (!validateSession()) return;

        const response = await getData(AVAILABILITY_EMPLOYEE_APPOINTMENTS_API(employeeId));

        if (response && response.success !== false && response.data) {
            populateAppointmentsTable(response.data);
        } else {
            populateAppointmentsTable([]);
        }
    } catch (error) {
        console.error("Error obteniendo citas del empleado:", error);
        populateAppointmentsTable([]);
    }
};

/**
 * Llenar tabla de citas
 */
const populateAppointmentsTable = (appointmentsData) => {
    const table = $('#appointmentsTable');
    if (!table.length) return;

    table.DataTable({
        destroy: true,
        data: appointmentsData,
        columns: [
            { 
                data: "clientName", 
                title: "Cliente",
                render: function(data) {
                    return data || 'N/A';
                }
            },
            { 
                data: "date", 
                title: "Fecha",
                render: function(data) {
                    if (!data) return 'N/A';
                    const date = new Date(data);
                    return date.toLocaleDateString('es-ES');
                }
            },
            { 
                data: "startTime", 
                title: "Hora",
                render: function(data) {
                    return data ? data.substring(0, 5) : 'N/A';
                }
            },
            { 
                data: "serviceName", 
                title: "Servicio",
                render: function(data) {
                    return data || 'N/A';
                }
            },
            { 
                data: "durationMin", 
                title: "Duración",
                render: function(data) {
                    return data ? data + ' min' : 'N/A';
                }
            },
            { 
                data: "status", 
                title: "Estado",
                render: function(data) {
                    const statusClass = data === 'Confirmada' ? 'bg-success' : 
                                      data === 'Programada' ? 'bg-primary' : 'bg-secondary';
                    return `<span class="badge ${statusClass}">${data || 'N/A'}</span>`;
                }
            }
        ],
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
        },
        responsive: true,
        order: [[1, 'desc'], [2, 'asc']],
        pageLength: 5
    });
};

/**
 * Verificación rápida de disponibilidad
 */
const handleQuickAvailabilityCheck = async (event) => {
    event.preventDefault();
    
    if (!validateSession()) return;

    const serviceId = document.getElementById('quickService').value;
    const date = document.getElementById('quickDate').value;

    if (!serviceId || !date) {
        showError("Por favor seleccione un servicio y una fecha.");
        return;
    }

    try {
        const quickCheckData = {
            ServiceId: parseInt(serviceId),
            Date: date + 'T00:00:00.000Z'
        };

        const response = await postData(AVAILABILITY_QUICK_CHECK_API, quickCheckData);

        if (response && response.success !== false && response.data) {
            showQuickAvailabilityResults(response.data);
        } else {
            showError("No se encontró disponibilidad para los criterios seleccionados.");
        }
    } catch (error) {
        console.error("Error en verificación rápida:", error);
        showError("Error al verificar disponibilidad.");
    }
};

/**
 * Mostrar resultados de disponibilidad rápida
 */
const showQuickAvailabilityResults = (availabilityData) => {
    console.log("Resultados de disponibilidad:", availabilityData);
    
    let message = "Horarios disponibles encontrados:\n\n";
    
    if (availabilityData.availableSlots && availabilityData.availableSlots.length > 0) {
        availabilityData.availableSlots.forEach(slot => {
            message += `• ${slot.startTime} - ${slot.employeeName}\n`;
        });
        showSuccess(message);
    } else {
        showError("No hay horarios disponibles para la fecha y servicio seleccionados.");
    }
};

/**
 * Mostrar opciones de reserva
 */
const showBookingOptions = () => {
    if (!selectedEmployee || !selectedTimeSlot) return;

    const employee = employeesData.find(emp => emp.employeeId === selectedEmployee);
    const formattedDate = formatDate(selectedDate);
    
    const confirmed = confirm(`¿Desea reservar cita con ${employee.name} el ${formattedDate} a las ${selectedTimeSlot}?`);
    
    if (confirmed) {
        showSuccess(`¡Cita reservada exitosamente con ${employee.name} para el ${formattedDate} a las ${selectedTimeSlot}!`);
        
        // Limpiar selección
        selectedTimeSlot = null;
        document.querySelectorAll('.time-slot').forEach(slot => {
            slot.classList.remove('border-primary', 'selected');
        });
        
        // Recargar disponibilidad
        loadTimeSlotsForEmployee(selectedEmployee);
        loadEmployeeAppointments(selectedEmployee);
    }
};

/**
 * Manejar filtros avanzados
 */
const handleAdvancedFilters = (event) => {
    event.preventDefault();
    
    const employeeId = document.getElementById('employeeSelect').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const timeSlot = document.getElementById('timeSlot').value;

    // Aplicar filtro de empleado
    if (employeeId) {
        selectedEmployee = parseInt(employeeId);
        
        // Buscar y seleccionar la tarjeta del empleado
        document.querySelectorAll('.employee-card').forEach(card => {
            card.classList.remove('border-primary', 'selected');
            if (parseInt(card.dataset.employeeId) === selectedEmployee) {
                card.classList.add('border-primary', 'selected');
            }
        });
        
        loadTimeSlotsForEmployee(selectedEmployee);
        loadEmployeeAppointments(selectedEmployee);
    }

    console.log("Filtros aplicados:", { employeeId, startDate, endDate, timeSlot });
};

/**
 * Navegación entre días
 */
const handleDayNavigation = (direction) => {
    if (direction === 'prev') {
        selectedDate.setDate(selectedDate.getDate() - 1);
    } else {
        selectedDate.setDate(selectedDate.getDate() + 1);
    }
    
    // Recargar toda la interfaz para el nuevo día
    loadEmployees(employeesData);
    
    if (selectedEmployee) {
        loadTimeSlotsForEmployee(selectedEmployee);
        loadEmployeeAppointments(selectedEmployee);
    } else {
        generateEmptyTimeSlots();
    }
};

// ===== INICIALIZACIÓN =====
document.addEventListener("DOMContentLoaded", async () => {
    // Validar sesión
    validateSession();

    // Event Listeners
    const closeSessionBtn = document.getElementById("closeSession");
    if (closeSessionBtn) {
        closeSessionBtn.addEventListener("click", closeSession);
    }

    const quickAvailabilityForm = document.getElementById("quickAvailabilityForm");
    if (quickAvailabilityForm) {
        quickAvailabilityForm.addEventListener("submit", handleQuickAvailabilityCheck);
    }

    const availabilityForm = document.getElementById("availabilityForm");
    if (availabilityForm) {
        availabilityForm.addEventListener("submit", handleAdvancedFilters);
    }

    const prevDayBtn = document.getElementById("prevDay");
    const nextDayBtn = document.getElementById("nextDay");
    
    if (prevDayBtn) {
        prevDayBtn.addEventListener("click", () => handleDayNavigation('prev'));
    }
    if (nextDayBtn) {
        nextDayBtn.addEventListener("click", () => handleDayNavigation('next'));
    }

    // Establecer fechas por defecto
    const today = new Date().toISOString().split('T')[0];
    const quickDateInput = document.getElementById('quickDate');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (quickDateInput) quickDateInput.value = today;
    if (startDateInput) startDateInput.value = today;
    if (endDateInput) endDateInput.value = today;

    // Cargar datos iniciales
    await obtainEmployeesWithSchedules();
    await obtainServices();
});

// ===== ASIGNACIÓN DE FUNCIONES AL SCOPE GLOBAL =====
window.handleTimeSlotSelection = handleTimeSlotSelection;