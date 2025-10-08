// Imports
import { ROLES_API } from "../config/constants.js";
import { getData } from "../data/methods.js";
import { showError, showSuccess, showConfirmation } from "../utils/sweetAlert.js";

// Mapeo de menuAccess a URLs y configuraciones del menú
// Mapeo de menuAccess a URLs y configuraciones del menú (CORREGIDO)
const menuConfig = {
    // Gestión
    'users': { url: 'users.html', text: 'Usuarios', icon: 'bi-people', category: 'gestion' },
    'roles': { url: 'roles.html', text: 'Roles', icon: 'bi-person-badge', category: 'gestion' },
    'employees': { url: 'employees.html', text: 'Empleados', icon: 'bi-person-video', category: 'gestion' },
    'clients': { url: 'clients.html', text: 'Clientes', icon: 'bi-person-circle', category: 'gestion' },
    'auth': { url: 'auth.html', text: 'Autenticación', icon: 'bi-person-circle', category: 'gestion' },
    
    // Servicios
    'services': { url: 'services.html', text: 'Servicios', icon: 'bi-list-check', category: 'servicios' },
    'appointments-services': { url: 'appointmentservices.html', text: 'Servicios de Citas', icon: 'bi-list-check', category: 'servicios' },
    
    // Citas
    'schedules': { url: 'schedules.html', text: 'Programación', icon: 'bi-clock', category: 'citas' },
    'appointments': { url: 'appointments.html', text: 'Citas', icon: 'bi-calendar-plus', category: 'citas' },
    
    // Otros módulos (items directos)
    'payments': { url: 'payments.html', text: 'Pagos', icon: 'bi-credit-card', category: 'direct' },
    'announces': { url: 'announces.html', text: 'Anuncios', icon: 'bi-megaphone', category: 'direct' },
    'reports': { url: 'reports.html', text: 'Reportes', icon: 'bi-graph-up', category: 'direct' }
};

// Categorías del menú
const menuCategories = {
    'gestion': {
        name: 'Gestión',
        icon: 'bi-gear',
        dropdownId: 'gestionDropdown'
    },
    'servicios': {
        name: 'Servicios',
        icon: 'bi-scissors',
        dropdownId: 'serviciosDropdown'
    },
    'citas': {
        name: 'Citas',
        icon: 'bi-calendar-event',
        dropdownId: 'citasDropdown'
    }
};

/**
 * Obtener menú de rol según el rol logueado
 */
const obtainDynamicMenu = async (roleId) => {
    try {
        if (!validateSession()) return;

        const response = await getData(ROLES_API);

        if (response.success) {
            const role = response.data.find(r => r.roleId === roleId);
            if (role) {
                generateMenu(role.menuAccess);
            } else {
                showError("No se encontró el rol del usuario.");
            }
        } else {
            showError(response?.message || "No se pudieron obtener los roles.");
        }
    } catch (error) {
        console.error("Error obteniendo roles:", error);
        showError(error.message || "Error al cargar roles");
    }
};

/**
 * Generar el menú dinámico basado en el menuAccess
 */
const generateMenu = (menuAccess) => {
    const menuItems = menuAccess.split(',');
    const navbarNav = document.querySelector('#navbarNav .navbar-nav');
    
    if (!navbarNav) {
        console.error('No se encontró el elemento navbar-nav');
        return;
    }

    // Limpiar menú existente (excepto el botón de cerrar sesión)
    const closeSessionBtn = navbarNav.querySelector('#closeSession').closest('.nav-item');
    navbarNav.innerHTML = '';
    
    // Agregar Inicio (siempre visible)
    const inicioItem = createMenuItem('dashboard.html', 'Inicio', 'bi-house-door', true);
    navbarNav.appendChild(inicioItem);

    // Agrupar items por categoría
    const categorizedItems = {};
    const directItems = [];

    menuItems.forEach(item => {
        const config = menuConfig[item.trim()];
        if (config) {
            if (config.category === 'direct') {
                directItems.push(config);
            } else {
                if (!categorizedItems[config.category]) {
                    categorizedItems[config.category] = [];
                }
                categorizedItems[config.category].push(config);
            }
        }
    });

    // Generar menús desplegables para cada categoría
    Object.keys(menuCategories).forEach(category => {
        if (categorizedItems[category] && categorizedItems[category].length > 0) {
            const dropdown = createDropdownMenu(
                menuCategories[category],
                categorizedItems[category]
            );
            navbarNav.appendChild(dropdown);
        }
    });

    // Agregar items directos
    directItems.forEach(item => {
        const directItem = createMenuItem(item.url, item.text, item.icon, false);
        navbarNav.appendChild(directItem);
    });

    // Agregar botón de cerrar sesión al final
    navbarNav.appendChild(closeSessionBtn);

    // Activar el item actual basado en la URL
    setActiveMenuItem();
};

/**
 * Crear item de menú simple
 */
const createMenuItem = (url, text, icon, isActive = false) => {
    const li = document.createElement('li');
    li.className = 'nav-item';

    const a = document.createElement('a');
    a.className = `nav-link ${isActive ? 'active' : ''}`;
    a.href = url;
    
    a.innerHTML = `
        <i class="bi ${icon} me-1"></i>${text}
    `;

    li.appendChild(a);
    return li;
};

/**
 * Crear menú desplegable
 */
const createDropdownMenu = (category, items) => {
    const li = document.createElement('li');
    li.className = 'nav-item dropdown';

    li.innerHTML = `
        <a class="nav-link dropdown-toggle" href="#" id="${category.dropdownId}" role="button"
            data-bs-toggle="dropdown" aria-expanded="false">
            <i class="bi ${category.icon} me-1"></i>${category.name}
        </a>
        <ul class="dropdown-menu" aria-labelledby="${category.dropdownId}">
            ${items.map(item => `
                <li>
                    <a class="dropdown-item" href="${item.url}">
                        <i class="bi ${item.icon} me-2"></i>${item.text}
                    </a>
                </li>
            `).join('')}
        </ul>
    `;

    return li;
};

/**
 * Establecer el item activo basado en la URL actual
 */
const setActiveMenuItem = () => {
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    
    // Remover active de todos los items
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Buscar y activar el item correspondiente a la página actual
    const currentLink = document.querySelector(`.nav-link[href="${currentPage}"]`);
    if (currentLink) {
        currentLink.classList.add('active');
    }
};

/**
 * Inicializar el menú dinámico
 */
const initializeDynamicMenu = () => {
    try {
        const sessionData = sessionStorage.getItem("sessionData");
        if (sessionData) {
            const userData = JSON.parse(sessionData);
            if (userData.roleId && userData.menuAccess) {
                // Usar menuAccess directamente de la sesión
                generateMenu(userData.menuAccess);
            } else if (userData.roleId) {
                // Obtener menuAccess desde la API de roles
                obtainDynamicMenu(userData.roleId);
            }
        }
    } catch (error) {
        console.error("Error inicializando menú dinámico:", error);
    }
};

export { obtainDynamicMenu, initializeDynamicMenu };