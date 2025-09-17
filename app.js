// Universal RFP Monitoring Platform - Enterprise Application (Fixed)
let currentUser = null;
let entities = [];
let rfps = [];
let searchAreas = [];
let users = [];
let auditLog = [];
let notifications = [];
let userPreferences = {};
let charts = {};
let deferredPrompt = null;
let isOnline = navigator.onLine;
let lastSyncTime = null;
let serviceWorkerRegistration = null;
let onboardingStep = 1;

// Application Configuration
const APP_CONFIG = {
    cacheName: 'universal-rfp-monitor-v1',
    version: '1.0.0',
    offlineTimeout: 5000,
    syncInterval: 30000,
    maxAuditEntries: 5000,
    maxNotifications: 100
};

// Role-based permissions system
const PERMISSIONS = {
    'Super Admin': ['*'], // All permissions
    'Admin': [
        'users.create', 'users.edit', 'users.delete', 'users.invite',
        'search_areas.create', 'search_areas.edit', 'search_areas.delete',
        'entities.create', 'entities.edit', 'entities.delete',
        'rfps.create', 'rfps.edit', 'rfps.delete', 'rfps.bulk_actions',
        'reports.generate', 'reports.export',
        'audit.view', 'system.manage'
    ],
    'Manager': [
        'users.edit', 'users.invite',
        'search_areas.create', 'search_areas.edit',
        'entities.edit', 'rfps.edit', 'rfps.bulk_actions',
        'reports.generate', 'reports.export'
    ],
    'Editor': [
        'search_areas.edit', 'entities.edit', 'rfps.edit',
        'reports.generate'
    ],
    'Viewer': [
        'entities.view', 'rfps.view', 'reports.view'
    ]
};

// Pre-configured search area templates
const SEARCH_AREA_TEMPLATES = [
    {
        id: 'sap',
        name: 'SAP',
        category: 'ERP',
        icon: '🏢',
        description: 'SAP enterprise solutions',
        keywords: ['SAP', 'S/4HANA', 'Ariba', 'SuccessFactors', 'Concur', 'ERP', 'HANA'],
        subcategories: ['ERP', 'HR', 'Procurement', 'Analytics']
    },
    {
        id: 'cloud',
        name: 'Cloud Services',
        category: 'Infrastructure',
        icon: '☁️',
        description: 'Cloud infrastructure and services',
        keywords: ['AWS', 'Azure', 'Google Cloud', 'GCP', 'cloud migration', 'hybrid cloud', 'multi-cloud'],
        subcategories: ['IaaS', 'PaaS', 'SaaS', 'Migration']
    },
    {
        id: 'ai',
        name: 'AI & Machine Learning',
        category: 'Technology',
        icon: '🤖',
        description: 'Artificial Intelligence and ML solutions',
        keywords: ['AI', 'machine learning', 'ML', 'artificial intelligence', 'neural networks', 'deep learning', 'automation'],
        subcategories: ['Analytics', 'Automation', 'Computer Vision', 'NLP']
    },
    {
        id: 'security',
        name: 'Cyber Security',
        category: 'Security',
        icon: '🔒',
        description: 'Cybersecurity and information security',
        keywords: ['cybersecurity', 'SIEM', 'endpoint protection', 'network security', 'firewall', 'threat detection'],
        subcategories: ['Network Security', 'Endpoint', 'SIEM', 'Identity Management']
    },
    {
        id: 'it_infrastructure',
        name: 'IT Infrastructure',
        category: 'Infrastructure',
        icon: '💻',
        description: 'IT infrastructure and networking',
        keywords: ['networking', 'servers', 'storage', 'data center', 'infrastructure', 'hardware'],
        subcategories: ['Networking', 'Storage', 'Servers', 'Data Center']
    },
    {
        id: 'microsoft',
        name: 'Microsoft',
        category: 'Software',
        icon: '📊',
        description: 'Microsoft enterprise solutions',
        keywords: ['Microsoft', 'Office 365', 'SharePoint', 'Dynamics', 'Azure AD', 'Teams'],
        subcategories: ['Office 365', 'SharePoint', 'Dynamics', 'Azure']
    }
];

// Sample entity data
const initialEntities = [
    {
        "Entity": "City of Toronto",
        "Type": "City",
        "Technology Usage": "SAP ERP, Microsoft 365, Oracle Database",
        "Source": "Municipal Technology Assessment",
        "Province": "Ontario",
        "Country": "Canada"
    },
    {
        "Entity": "City of Vancouver",
        "Type": "City", 
        "Technology Usage": "SAP S/4HANA, AWS Cloud, Salesforce",
        "Source": "Digital Strategy Report",
        "Province": "British Columbia",
        "Country": "Canada"
    },
    {
        "Entity": "Government of Alberta",
        "Type": "Province",
        "Technology Usage": "Microsoft Azure, SAP Ariba, Oracle Cloud",
        "Source": "IT Modernization Plan",
        "Province": "Alberta",
        "Country": "Canada"
    },
    {
        "Entity": "Hydro-Québec",
        "Type": "Utility",
        "Technology Usage": "SAP S/4HANA, Azure Cloud, AI Analytics",
        "Source": "Technology Roadmap",
        "Province": "Quebec",
        "Country": "Canada"
    },
    {
        "Entity": "Toronto Transit Commission",
        "Type": "Transit",
        "Technology Usage": "SAP ERP, Microsoft Dynamics, IoT Sensors",
        "Source": "Digital Infrastructure Report",
        "Province": "Ontario",
        "Country": "Canada"
    }
];

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Universal RFP Monitoring Platform...');
    
    // Initialize data first
    initializeApplication();
    
    // Then setup PWA features
    initializePWA();
    
    // Finally setup all event listeners
    setTimeout(() => {
        setupEventListeners();
        console.log('Application fully initialized');
    }, 100);
});

// Initialize core application
function initializeApplication() {
    console.log('Initializing application core...');
    
    // Load data from storage
    const storedEntities = loadFromStorage('entities');
    const storedRfps = loadFromStorage('rfps');
    const storedSearchAreas = loadFromStorage('searchAreas');
    const storedUsers = loadFromStorage('users');
    const storedAuditLog = loadFromStorage('auditLog');
    const storedPreferences = loadFromStorage('userPreferences');
    const storedSyncTime = loadFromStorage('lastSyncTime');
    
    // Initialize entities
    if (storedEntities && storedEntities.length > 0) {
        entities = storedEntities;
    } else {
        entities = JSON.parse(JSON.stringify(initialEntities));
        saveToStorage('entities', entities);
    }
    
    // Initialize search areas
    if (storedSearchAreas && storedSearchAreas.length > 0) {
        searchAreas = storedSearchAreas;
    } else {
        generateInitialSearchAreas();
        saveToStorage('searchAreas', searchAreas);
    }
    
    // Initialize users
    if (storedUsers && storedUsers.length > 0) {
        users = storedUsers;
    } else {
        generateMockUsers();
        saveToStorage('users', users);
    }
    
    // Initialize RFPs
    if (storedRfps && storedRfps.length > 0) {
        rfps = storedRfps;
    } else {
        generateMockRFPs();
        saveToStorage('rfps', rfps);
    }
    
    // Load other data
    if (storedAuditLog) auditLog = storedAuditLog;
    if (storedPreferences) userPreferences = storedPreferences;
    if (storedSyncTime) lastSyncTime = storedSyncTime;
    
    // Check for existing user session
    const storedUser = loadFromStorage('currentUser');
    if (storedUser) {
        currentUser = storedUser;
        if (currentUser.onboardingCompleted) {
            showMainApplication();
        } else {
            showOnboardingModal();
        }
    } else {
        showWelcomeScreen();
    }
    
    console.log('Application initialized with', entities.length, 'entities,', 
                searchAreas.length, 'search areas,', users.length, 'users, and', 
                rfps.length, 'RFPs');
}

// Generate initial search areas from templates
function generateInitialSearchAreas() {
    searchAreas = SEARCH_AREA_TEMPLATES.map((template, index) => ({
        id: template.id,
        name: template.name,
        category: template.category,
        icon: template.icon,
        description: template.description,
        keywords: template.keywords,
        subcategories: template.subcategories,
        isActive: index < 4, // First 4 are active by default
        isTemplate: true,
        createdBy: 'System',
        createdAt: new Date().toISOString(),
        rfpCount: Math.floor(Math.random() * 50) + 10,
        lastMatch: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }));
    
    console.log('Generated', searchAreas.length, 'initial search areas');
}

// Generate mock users
function generateMockUsers() {
    const mockUsers = [
        { name: 'Sarah Chen', email: 'sarah.chen@toronto.ca', department: 'IT', role: 'Admin' },
        { name: 'Michael Rodriguez', email: 'michael.rodriguez@vancouver.ca', department: 'Procurement', role: 'Manager' },
        { name: 'Emily Johnson', email: 'emily.johnson@alberta.ca', department: 'Digital Services', role: 'Editor' },
        { name: 'David Kim', email: 'david.kim@hydro.qc.ca', department: 'Technology', role: 'Manager' },
        { name: 'Lisa Thompson', email: 'lisa.thompson@ttc.ca', department: 'IT Operations', role: 'Editor' }
    ];
    
    users = mockUsers.map((user, index) => ({
        id: index + 1,
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role,
        avatar: '👤',
        status: Math.random() > 0.1 ? 'active' : 'inactive',
        lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        searchAreasSubscribed: Math.floor(Math.random() * 6) + 2,
        timezone: 'America/Toronto',
        onboardingCompleted: true,
        preferences: {
            emailNotifications: true,
            instantAlerts: Math.random() > 0.5,
            weeklyReports: true,
            dashboardLayout: 'default'
        }
    }));
    
    console.log('Generated', users.length, 'mock users');
}

// Generate mock RFPs
function generateMockRFPs() {
    const rfpTemplates = [
        { title: 'SAP S/4HANA Implementation Services', area: 'sap', value: 2500000 },
        { title: 'Cloud Infrastructure Migration to AWS', area: 'cloud', value: 1800000 },
        { title: 'AI-Powered Analytics Platform', area: 'ai', value: 950000 },
        { title: 'Cybersecurity Assessment and Implementation', area: 'security', value: 1200000 },
        { title: 'Network Infrastructure Upgrade', area: 'it_infrastructure', value: 800000 },
        { title: 'Microsoft 365 Migration and Support', area: 'microsoft', value: 650000 }
    ];
    
    rfps = [];
    
    for (let i = 0; i < 25; i++) {
        const template = rfpTemplates[Math.floor(Math.random() * rfpTemplates.length)];
        const entity = entities[Math.floor(Math.random() * entities.length)];
        const area = searchAreas.find(a => a.id === template.area);
        
        const datePosted = new Date();
        datePosted.setDate(datePosted.getDate() - Math.floor(Math.random() * 45));
        
        const closingDate = new Date(datePosted);
        closingDate.setDate(closingDate.getDate() + 21 + Math.floor(Math.random() * 30));
        
        const statuses = ['New', 'Reviewing', 'Tracked', 'Archived'];
        
        rfps.push({
            id: i + 1,
            title: template.title,
            entity: entity.Entity,
            technologyArea: area ? area.name : 'General IT',
            areaId: template.area,
            value: `$${(template.value + Math.random() * 500000).toLocaleString('en-CA', {maximumFractionDigits: 0})}`,
            rawValue: template.value,
            datePosted: datePosted.toISOString().split('T')[0],
            closingDate: closingDate.toISOString().split('T')[0],
            status: statuses[Math.floor(Math.random() * statuses.length)],
            description: `Request for proposal for ${template.title.toLowerCase()} services for ${entity.Entity}.`,
            requirements: ['Technical expertise', 'Project management', 'Implementation support'],
            matchScore: Math.floor(Math.random() * 30) + 70,
            assignedTo: users[Math.floor(Math.random() * users.length)]?.name || 'Unassigned'
        });
    }
    
    console.log('Generated', rfps.length, 'mock RFPs');
}

// PWA Initialization
async function initializePWA() {
    // Register service worker
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            serviceWorkerRegistration = registration;
            console.log('Service Worker registered');
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }
    
    // Handle PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallBanner();
    });
    
    // Handle app installed event
    window.addEventListener('appinstalled', () => {
        hideInstallBanner();
        showToast('App installed successfully!', 'success');
        updatePWAStatus();
    });
    
    // Network status monitoring
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);
    
    updateNetworkStatus();
    updatePWAStatus();
    
    if (isOnline) {
        startPeriodicSync();
    }
}

function handleOnlineStatus() {
    isOnline = true;
    updateNetworkStatus();
    hideNetworkStatus();
    showToast('Connection restored', 'success');
    syncData();
    startPeriodicSync();
}

function handleOfflineStatus() {
    isOnline = false;
    updateNetworkStatus(); 
    showNetworkStatus();
    showToast('You are offline. Some features may be limited.', 'warning');
    stopPeriodicSync();
}

function updateNetworkStatus() {
    const networkStatus = document.getElementById('networkStatusText');
    if (networkStatus) {
        networkStatus.textContent = isOnline ? '✅ Online' : '📴 Offline - Limited functionality';
    }
}

function showNetworkStatus() {
    const networkStatus = document.getElementById('networkStatus');
    if (networkStatus) networkStatus.classList.remove('hidden');
}

function hideNetworkStatus() {
    const networkStatus = document.getElementById('networkStatus');
    if (networkStatus) networkStatus.classList.add('hidden');
}

function updatePWAStatus() {
    const pwaStatus = document.getElementById('pwaStatusIndicator');
    if (pwaStatus) {
        if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
            pwaStatus.textContent = '📱 PWA';
        } else {
            pwaStatus.textContent = '🌐 Web';
        }
    }
}

// Install Banner Management
function showInstallBanner() {
    const installBanner = document.getElementById('installBanner');
    if (installBanner && deferredPrompt) {
        installBanner.classList.remove('hidden');
    }
}

function hideInstallBanner() {
    const installBanner = document.getElementById('installBanner');
    if (installBanner) installBanner.classList.add('hidden');
}

// Data Persistence
function saveToStorage(key, data) {
    try {
        const serializedData = JSON.stringify({
            data: data,
            timestamp: Date.now(),
            version: APP_CONFIG.version
        });
        localStorage.setItem(key, serializedData);
        return true;
    } catch (error) {
        console.error('Failed to save to storage:', error);
        return false;
    }
}

function loadFromStorage(key) {
    try {
        const serializedData = localStorage.getItem(key);
        if (!serializedData) return null;
        const parsed = JSON.parse(serializedData);
        return parsed.data;
    } catch (error) {
        console.error('Failed to load from storage:', error);
        return null;
    }
}

// Sync Management
let syncInterval = null;

function startPeriodicSync() {
    if (syncInterval) clearInterval(syncInterval);
    syncInterval = setInterval(() => {
        if (isOnline) syncData();
    }, APP_CONFIG.syncInterval);
}

function stopPeriodicSync() {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
    }
}

async function syncData() {
    if (!isOnline) return;
    
    const refreshIcon = document.getElementById('refreshIcon');
    if (refreshIcon) refreshIcon.classList.add('sync-loading');
    
    try {
        // Simulate API sync
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Save data to storage
        saveToStorage('entities', entities);
        saveToStorage('rfps', rfps);
        saveToStorage('searchAreas', searchAreas);
        saveToStorage('users', users);
        saveToStorage('auditLog', auditLog);
        saveToStorage('userPreferences', userPreferences);
        
        lastSyncTime = Date.now();
        saveToStorage('lastSyncTime', lastSyncTime);
        
        updateLastSyncTime();
        console.log('Data synced successfully');
    } catch (error) {
        console.error('Sync failed:', error);
        showToast('Sync failed. Will retry later.', 'error');
    } finally {
        if (refreshIcon) refreshIcon.classList.remove('sync-loading');
    }
}

// Event Listeners Setup - FIXED
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // PWA Install Banner
    setupPWAEventListeners();
    
    // Authentication - FIXED
    setupAuthEventListeners();
    
    // Onboarding
    setupOnboardingEventListeners();
    
    // Main App Navigation
    setupNavigationEventListeners();
    
    // User Management
    setupUserManagementEventListeners();
    
    // Search Areas
    setupSearchAreasEventListeners();
    
    // RFP Management
    setupRFPEventListeners();
    
    // System Actions
    setupSystemEventListeners();
    
    console.log('Event listeners set up successfully');
}

function setupPWAEventListeners() {
    const installBtn = document.getElementById('installBtn');
    const dismissInstallBtn = document.getElementById('dismissInstallBtn');
    
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const choiceResult = await deferredPrompt.userChoice;
                console.log('Install prompt result:', choiceResult);
                deferredPrompt = null;
                hideInstallBanner();
            }
        });
    }
    
    if (dismissInstallBtn) {
        dismissInstallBtn.addEventListener('click', () => {
            hideInstallBanner();
            deferredPrompt = null;
        });
    }
}

// Authentication Event Listeners - FIXED
function setupAuthEventListeners() {
    console.log('Setting up authentication event listeners...');
    
    // Auth tabs - FIXED
    const authTabs = document.querySelectorAll('.auth-tab');
    authTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = e.target.getAttribute('data-tab');
            console.log('Switching to tab:', tabName);
            switchAuthTab(tabName);
        });
    });
    
    // Login form - FIXED
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Login form submitted');
            handleLogin();
        });
    }
    
    // Registration form - FIXED
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Registration form submitted');
            handleRegistration();
        });
    }
    
    // User menu
    setupUserMenuEventListeners();
    
    console.log('Authentication event listeners setup complete');
}

function setupUserMenuEventListeners() {
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userMenu = document.getElementById('userMenu');
    const logoutMenuItem = document.getElementById('logoutMenuItem');
    
    if (userMenuBtn && userMenu) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userMenu.classList.toggle('hidden');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!userMenuBtn.contains(e.target) && !userMenu.contains(e.target)) {
                userMenu.classList.add('hidden');
            }
        });
    }
    
    if (logoutMenuItem) {
        logoutMenuItem.addEventListener('click', handleLogout);
    }
}

// Onboarding Event Listeners
function setupOnboardingEventListeners() {
    const nextBtn = document.getElementById('nextOnboardingBtn');
    const prevBtn = document.getElementById('prevOnboardingBtn');
    const completeBtn = document.getElementById('completeOnboardingBtn');
    
    if (nextBtn) nextBtn.addEventListener('click', nextOnboardingStep);
    if (prevBtn) prevBtn.addEventListener('click', prevOnboardingStep);
    if (completeBtn) completeBtn.addEventListener('click', completeOnboarding);
    
    // Avatar selection
    document.querySelectorAll('.avatar-option').forEach(option => {
        option.addEventListener('click', (e) => {
            document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('active'));
            e.target.classList.add('active');
        });
    });
    
    // Search area selection
    document.querySelectorAll('.search-area-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const checkbox = card.querySelector('.area-checkbox');
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
            }
            card.classList.toggle('selected', checkbox.checked);
        });
    });
    
    // Layout selection
    document.querySelectorAll('.layout-option').forEach(option => {
        option.addEventListener('click', (e) => {
            document.querySelectorAll('.layout-option').forEach(opt => opt.classList.remove('active'));
            e.target.closest('.layout-option').classList.add('active');
        });
    });
}

// Navigation Event Listeners
function setupNavigationEventListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            if (tab) {
                console.log('Switching to navigation tab:', tab);
                switchTab(tab);
            }
        });
    });
    
    // Refresh data
    const refreshBtn = document.getElementById('refreshDataBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', syncData);
    }
}

// User Management Event Listeners
function setupUserManagementEventListeners() {
    const inviteUserBtn = document.getElementById('inviteUserBtn');
    if (inviteUserBtn) {
        inviteUserBtn.addEventListener('click', showUserInviteModal);
    }
    
    const userSearch = document.getElementById('userSearch');
    if (userSearch) {
        userSearch.addEventListener('input', debounce(filterUsers, 300));
    }
    
    const roleFilter = document.getElementById('roleFilter');
    if (roleFilter) {
        roleFilter.addEventListener('change', filterUsers);
    }
    
    // User invite modal
    setupUserInviteModal();
}

// Search Areas Event Listeners
function setupSearchAreasEventListeners() {
    const addSearchAreaBtn = document.getElementById('addSearchAreaBtn');
    if (addSearchAreaBtn) {
        addSearchAreaBtn.addEventListener('click', showSearchAreaModal);
    }
    
    const manageTemplatesBtn = document.getElementById('manageTemplatesBtn');
    if (manageTemplatesBtn) {
        manageTemplatesBtn.addEventListener('click', showTemplatesDialog);
    }
    
    // Search area modal
    setupSearchAreaModal();
}

// RFP Event Listeners
function setupRFPEventListeners() {
    const rfpSearch = document.getElementById('rfpSearch');
    if (rfpSearch) {
        rfpSearch.addEventListener('input', debounce(filterRFPs, 300));
    }
    
    const rfpAreaFilter = document.getElementById('rfpAreaFilter');
    if (rfpAreaFilter) {
        rfpAreaFilter.addEventListener('change', filterRFPs);
    }
    
    const rfpStatusFilter = document.getElementById('rfpStatusFilter');
    if (rfpStatusFilter) {
        rfpStatusFilter.addEventListener('change', filterRFPs);
    }
    
    const selectAllRfps = document.getElementById('selectAllRfps');
    if (selectAllRfps) {
        selectAllRfps.addEventListener('change', handleSelectAllRFPs);
    }
}

// System Event Listeners
function setupSystemEventListeners() {
    const exportDataBtn = document.getElementById('exportDataBtn');
    const backupDataBtn = document.getElementById('backupDataBtn');
    const clearCacheBtn = document.getElementById('clearCacheBtn');
    
    if (exportDataBtn) exportDataBtn.addEventListener('click', exportAllData);
    if (backupDataBtn) backupDataBtn.addEventListener('click', backupSystemData);
    if (clearCacheBtn) clearCacheBtn.addEventListener('click', clearApplicationCache);
}

// Authentication Functions - FIXED
function switchAuthTab(tabName) {
    console.log('Switching authentication tab to:', tabName);
    
    // Remove active class from all tabs and content
    const allTabs = document.querySelectorAll('.auth-tab');
    const allContent = document.querySelectorAll('.auth-content');
    
    allTabs.forEach(tab => tab.classList.remove('active'));
    allContent.forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
    const selectedContent = document.getElementById(`${tabName}Tab`);
    
    if (selectedTab) {
        selectedTab.classList.add('active');
        console.log('Tab activated:', tabName);
    } else {
        console.error('Tab not found:', tabName);
    }
    
    if (selectedContent) {
        selectedContent.classList.add('active');
        console.log('Content activated:', `${tabName}Tab`);
    } else {
        console.error('Content not found:', `${tabName}Tab`);
    }
}

function handleLogin() {
    console.log('Handling login...');
    
    const emailField = document.getElementById('loginEmail');
    const passwordField = document.getElementById('loginPassword');
    
    if (!emailField || !passwordField) {
        console.error('Login form fields not found');
        showToast('Login form error. Please refresh the page.', 'error');
        return;
    }
    
    const email = emailField.value.trim();
    const password = passwordField.value.trim();
    
    console.log('Login attempt with email:', email);
    
    if (!email || !password) {
        showToast('Please enter both email and password', 'error');
        return;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }
    
    // Find user or create demo user
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
        // Create demo user for any valid email
        user = {
            id: users.length + 1,
            name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            email: email.toLowerCase(),
            department: 'Demo Department',
            role: 'Editor',
            avatar: '👤',
            status: 'active',
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            searchAreasSubscribed: 3,
            timezone: 'America/Toronto',
            onboardingCompleted: false,
            preferences: {
                emailNotifications: true,
                instantAlerts: false,
                weeklyReports: true,
                dashboardLayout: 'default'
            }
        };
        users.push(user);
        saveToStorage('users', users);
        console.log('Created new demo user:', user.name);
    }
    
    currentUser = user;
    currentUser.lastLogin = new Date().toISOString();
    saveToStorage('currentUser', currentUser);
    
    addAuditEntry('User Login', `User ${user.name} logged in`, user.id);
    showToast(`Welcome ${user.name}!`, 'success');
    
    // Clear form
    emailField.value = '';
    passwordField.value = '';
    
    // Check if user needs onboarding
    if (!currentUser.onboardingCompleted) {
        console.log('User needs onboarding');
        showOnboardingModal();
    } else {
        console.log('User onboarding complete, showing main app');
        showMainApplication();
    }
}

function handleRegistration() {
    console.log('Handling registration...');
    
    const nameField = document.getElementById('regFullName');
    const emailField = document.getElementById('regEmail');
    const departmentField = document.getElementById('regDepartment');
    const passwordField = document.getElementById('regPassword');
    
    if (!nameField || !emailField || !departmentField || !passwordField) {
        console.error('Registration form fields not found');
        showToast('Registration form error. Please refresh the page.', 'error');
        return;
    }
    
    const name = nameField.value.trim();
    const email = emailField.value.trim();
    const department = departmentField.value;
    const password = passwordField.value.trim();
    
    console.log('Registration attempt:', { name, email, department });
    
    if (!name || !email || !department || !password) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }
    
    // Check if user already exists
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        showToast('User with this email already exists', 'error');
        return;
    }
    
    // Create new user
    const newUser = {
        id: users.length + 1,
        name,
        email: email.toLowerCase(),
        department,
        role: 'Viewer', // Default role for self-registration
        avatar: '👤',
        status: 'active',
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        searchAreasSubscribed: 0,
        timezone: 'America/Toronto',
        onboardingCompleted: false,
        preferences: {
            emailNotifications: true,
            instantAlerts: false,
            weeklyReports: true,
            dashboardLayout: 'default'
        }
    };
    
    users.push(newUser);
    saveToStorage('users', users);
    
    currentUser = newUser;
    saveToStorage('currentUser', currentUser);
    
    addAuditEntry('User Registration', `New user ${name} registered`, newUser.id);
    showToast('Registration successful! Welcome to the platform.', 'success');
    
    // Clear form
    nameField.value = '';
    emailField.value = '';
    departmentField.value = '';
    passwordField.value = '';
    
    console.log('Registration successful, showing onboarding');
    showOnboardingModal();
}

function handleLogout() {
    if (currentUser) {
        addAuditEntry('User Logout', `User ${currentUser.name} logged out`, currentUser.id);
    }
    
    currentUser = null;
    localStorage.removeItem('currentUser');
    
    showWelcomeScreen();
    showToast('Logged out successfully', 'success');
}

// Screen Management - FIXED
function showWelcomeScreen() {
    console.log('Showing welcome screen');
    document.getElementById('welcomeScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('onboardingModal').classList.add('hidden');
    
    // Reset to login tab by default
    switchAuthTab('login');
}

function showOnboardingModal() {
    console.log('Showing onboarding modal');
    document.getElementById('welcomeScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('onboardingModal').classList.remove('hidden');
    
    onboardingStep = 1;
    updateOnboardingStep();
}

function showMainApplication() {
    console.log('Showing main application');
    document.getElementById('welcomeScreen').classList.add('hidden');
    document.getElementById('onboardingModal').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    updateUserProfile();
    switchTab('dashboard');
    updateLastSyncTime();
}

// Onboarding Functions
function updateOnboardingStep() {
    console.log('Updating onboarding step:', onboardingStep);
    
    // Update progress indicators
    document.querySelectorAll('.step').forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed');
        
        if (stepNum < onboardingStep) {
            step.classList.add('completed');
        } else if (stepNum === onboardingStep) {
            step.classList.add('active');
        }
    });
    
    // Show/hide steps
    document.querySelectorAll('.onboarding-step').forEach((step, index) => {
        step.classList.toggle('active', index + 1 === onboardingStep);
    });
    
    // Update buttons
    const prevBtn = document.getElementById('prevOnboardingBtn');
    const nextBtn = document.getElementById('nextOnboardingBtn');
    const completeBtn = document.getElementById('completeOnboardingBtn');
    
    if (prevBtn) prevBtn.disabled = onboardingStep === 1;
    
    if (onboardingStep === 3) {
        if (nextBtn) nextBtn.classList.add('hidden');
        if (completeBtn) completeBtn.classList.remove('hidden');
    } else {
        if (nextBtn) nextBtn.classList.remove('hidden');
        if (completeBtn) completeBtn.classList.add('hidden');
    }
}

function nextOnboardingStep() {
    if (onboardingStep < 3) {
        onboardingStep++;
        updateOnboardingStep();
    }
}

function prevOnboardingStep() {
    if (onboardingStep > 1) {
        onboardingStep--;
        updateOnboardingStep();
    }
}

function completeOnboarding() {
    if (!currentUser) return;
    
    console.log('Completing onboarding for user:', currentUser.name);
    
    // Save profile data
    const selectedAvatar = document.querySelector('.avatar-option.active')?.dataset.avatar || '👤';
    const timezone = document.getElementById('profileTimezone')?.value || 'America/Toronto';
    const bio = document.getElementById('profileBio')?.value?.trim() || '';
    
    // Save search area selections
    const selectedAreas = [];
    document.querySelectorAll('.area-checkbox:checked').forEach(checkbox => {
        selectedAreas.push(checkbox.value);
    });
    
    // Save preferences
    const preferences = {
        emailNotifications: document.getElementById('dailyDigest')?.checked || true,
        instantAlerts: document.getElementById('instantAlerts')?.checked || false,
        weeklyReports: document.getElementById('weeklyReport')?.checked || true,
        dashboardLayout: document.querySelector('.layout-option.active')?.dataset.layout || 'default'
    };
    
    // Update user
    currentUser.avatar = selectedAvatar;
    currentUser.timezone = timezone;
    currentUser.bio = bio;
    currentUser.searchAreasSubscribed = selectedAreas.length;
    currentUser.preferences = preferences;
    currentUser.onboardingCompleted = true;
    
    // Subscribe to selected search areas
    selectedAreas.forEach(areaId => {
        const area = searchAreas.find(a => a.id === areaId);
        if (area) {
            if (!area.subscribers) area.subscribers = [];
            if (!area.subscribers.includes(currentUser.id)) {
                area.subscribers.push(currentUser.id);
            }
        }
    });
    
    // Save data
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
    }
    
    saveToStorage('currentUser', currentUser);
    saveToStorage('users', users);
    saveToStorage('searchAreas', searchAreas);
    
    addAuditEntry('Onboarding Completed', `User ${currentUser.name} completed onboarding`, currentUser.id);
    
    showToast('Welcome! Your profile has been set up successfully.', 'success');
    showMainApplication();
}

// Navigation Functions
function switchTab(tabName) {
    console.log('Switching to main app tab:', tabName);
    
    // Check permissions
    if (!hasPermission(tabName)) {
        showToast('You do not have permission to access this section', 'error');
        return;
    }
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    const activeNavItem = document.querySelector(`[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(tabName);
    
    if (activeNavItem) activeNavItem.classList.add('active');
    if (activeContent) activeContent.classList.add('active');
    
    // Load tab-specific content
    switch(tabName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'search-areas':
            loadSearchAreas();
            break;
        case 'users':
            loadUsers();
            break;
        case 'rfps':
            loadRFPs();
            break;
        case 'audit':
            loadAuditLog();
            break;
        case 'profile':
            loadProfile();
            break;
        default:
            console.log('Loading tab:', tabName);
    }
}

// Permission system
function hasPermission(action) {
    if (!currentUser) return false;
    
    const userPermissions = PERMISSIONS[currentUser.role] || [];
    
    // Super admin has all permissions
    if (userPermissions.includes('*')) return true;
    
    // Check specific permission
    return userPermissions.includes(action) || userPermissions.includes(`${action}.view`);
}

function checkPermission(action) {
    if (!hasPermission(action)) {
        showToast('Insufficient permissions for this action', 'error');
        return false;
    }
    return true;
}

// Dashboard Functions
function loadDashboard() {
    console.log('Loading dashboard...');
    
    updatePersonalKPIs();
    setTimeout(() => {
        createDashboardCharts();
        loadRecentActivity();
    }, 100);
}

function updatePersonalKPIs() {
    // Get user's subscribed areas
    const userAreas = searchAreas.filter(area => 
        area.subscribers && area.subscribers.includes(currentUser.id)
    );
    
    const personalRfps = rfps.filter(rfp => 
        userAreas.some(area => area.id === rfp.areaId)
    ).length;
    
    const today = new Date().toDateString();
    const newToday = rfps.filter(rfp => 
        new Date(rfp.datePosted).toDateString() === today &&
        userAreas.some(area => area.id === rfp.areaId)
    ).length;
    
    const activeAreas = userAreas.filter(area => area.isActive).length;
    const alertsThisWeek = Math.floor(Math.random() * 15) + 5; // Simulated
    
    // Update KPI displays
    const elements = {
        personalRfps: document.getElementById('personalRfps'),
        newToday: document.getElementById('newToday'),
        activeAreas: document.getElementById('activeAreas'),
        alertsReceived: document.getElementById('alertsReceived')
    };
    
    if (elements.personalRfps) elements.personalRfps.textContent = personalRfps;
    if (elements.newToday) elements.newToday.textContent = newToday;
    if (elements.activeAreas) elements.activeAreas.textContent = activeAreas;
    if (elements.alertsReceived) elements.alertsReceived.textContent = alertsThisWeek;
}

function createDashboardCharts() {
    createTechnologyChart();
    createTrendsChart();
}

function createTechnologyChart() {
    const canvas = document.getElementById('technologyChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Get RFP counts by technology area
    const areaCounts = {};
    rfps.forEach(rfp => {
        const area = searchAreas.find(a => a.id === rfp.areaId);
        const areaName = area ? area.name : 'Other';
        areaCounts[areaName] = (areaCounts[areaName] || 0) + 1;
    });
    
    if (charts.technologyChart) {
        charts.technologyChart.destroy();
    }
    
    const labels = Object.keys(areaCounts);
    const data = Object.values(areaCounts);
    
    charts.technologyChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function createTrendsChart() {
    const canvas = document.getElementById('trendsChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Generate 7 days of data
    const labels = [];
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }));
        
        // Count RFPs for this date (simulated trend)
        const baseCount = 3;
        const variation = Math.floor(Math.random() * 8);
        data.push(baseCount + variation);
    }
    
    if (charts.trendsChart) {
        charts.trendsChart.destroy();
    }
    
    charts.trendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'New RFPs',
                data,
                borderColor: '#1FB8CD',
                backgroundColor: 'rgba(31, 184, 205, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function loadRecentActivity() {
    const feed = document.getElementById('recentActivityFeed');
    if (!feed) return;
    
    feed.innerHTML = '';
    
    // Get recent RFPs (last 8)
    const recentRfps = rfps
        .sort((a, b) => new Date(b.datePosted) - new Date(a.datePosted))
        .slice(0, 8);
    
    recentRfps.forEach(rfp => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item fade-in';
        
        const daysSince = Math.floor((Date.now() - new Date(rfp.datePosted)) / (1000 * 60 * 60 * 24));
        const timeText = daysSince === 0 ? 'Today' : 
                        daysSince === 1 ? 'Yesterday' :
                        `${daysSince} days ago`;
        
        activityItem.innerHTML = `
            <div class="activity-icon">${searchAreas.find(a => a.id === rfp.areaId)?.icon || '📋'}</div>
            <div class="activity-content">
                <div class="activity-title">${rfp.title}</div>
                <div class="activity-meta">${rfp.entity} • ${rfp.technologyArea} • ${timeText}</div>
            </div>
        `;
        
        feed.appendChild(activityItem);
    });
}

// Search Areas Functions
function loadSearchAreas() {
    console.log('Loading search areas...');
    
    updateSearchAreaCounts();
    renderActiveAreas();
    renderTemplateAreas();
}

function updateSearchAreaCounts() {
    const activeCount = searchAreas.filter(area => area.isActive && !area.isTemplate).length;
    const templateCount = SEARCH_AREA_TEMPLATES.length;
    
    const activeCountEl = document.getElementById('activeAreasCount');
    const templatesCountEl = document.getElementById('templatesCount');
    
    if (activeCountEl) activeCountEl.textContent = activeCount + searchAreas.filter(area => area.isActive && area.isTemplate).length;
    if (templatesCountEl) templatesCountEl.textContent = templateCount;
}

function renderActiveAreas() {
    const container = document.getElementById('activeAreasList');
    if (!container) return;
    
    container.innerHTML = '';
    
    const activeAreas = searchAreas.filter(area => area.isActive);
    
    if (activeAreas.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary); padding: 2rem;">No active search areas. Add some from templates or create custom ones.</p>';
        return;
    }
    
    activeAreas.forEach(area => {
        const areaElement = createSearchAreaElement(area);
        container.appendChild(areaElement);
    });
}

function renderTemplateAreas() {
    const container = document.getElementById('templatesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    SEARCH_AREA_TEMPLATES.forEach(template => {
        const isActive = searchAreas.find(area => area.id === template.id && area.isActive);
        const templateElement = createTemplateAreaElement(template, isActive);
        container.appendChild(templateElement);
    });
}

function createSearchAreaElement(area) {
    const element = document.createElement('div');
    element.className = 'area-item';
    
    element.innerHTML = `
        <div class="area-info">
            <div class="area-name">${area.icon} ${area.name}</div>
            <div class="area-keywords">${area.keywords.slice(0, 3).join(', ')}${area.keywords.length > 3 ? '...' : ''}</div>
        </div>
        <div class="area-actions">
            <div class="area-toggle ${area.isActive ? 'active' : ''}" onclick="toggleSearchArea('${area.id}')"></div>
            <button class="btn btn--outline btn--sm" onclick="editSearchArea('${area.id}')">Edit</button>
            ${!area.isTemplate ? `<button class="btn btn--outline btn--sm" onclick="deleteSearchArea('${area.id}')" style="color: var(--color-error);">Delete</button>` : ''}
        </div>
    `;
    
    return element;
}

function createTemplateAreaElement(template, isActive) {
    const element = document.createElement('div');
    element.className = 'area-item';
    
    element.innerHTML = `
        <div class="area-info">
            <div class="area-name">${template.icon} ${template.name}</div>
            <div class="area-keywords">${template.description}</div>
        </div>
        <div class="area-actions">
            <button class="btn ${isActive ? 'btn--outline' : 'btn--primary'} btn--sm" 
                    onclick="${isActive ? `deactivateTemplate('${template.id}')` : `activateTemplate('${template.id}')`}">
                ${isActive ? 'Remove' : 'Add'}
            </button>
        </div>
    `;
    
    return element;
}

// Global functions for search area management
window.toggleSearchArea = function(areaId) {
    if (!checkPermission('search_areas.edit')) return;
    
    const area = searchAreas.find(a => a.id === areaId);
    if (!area) return;
    
    area.isActive = !area.isActive;
    saveToStorage('searchAreas', searchAreas);
    
    addAuditEntry('Search Area Toggled', `${area.name} ${area.isActive ? 'activated' : 'deactivated'}`, currentUser.id);
    
    loadSearchAreas();
    updatePersonalKPIs();
    
    showToast(`${area.name} ${area.isActive ? 'activated' : 'deactivated'}`, 'success');
}

window.activateTemplate = function(templateId) {
    if (!checkPermission('search_areas.create')) return;
    
    const template = SEARCH_AREA_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    
    const existingArea = searchAreas.find(a => a.id === templateId);
    if (existingArea) {
        existingArea.isActive = true;
    } else {
        const newArea = {
            ...template,
            isActive: true,
            isTemplate: true,
            createdBy: currentUser.name,
            createdAt: new Date().toISOString(),
            subscribers: [currentUser.id],
            rfpCount: 0,
            lastMatch: null
        };
        searchAreas.push(newArea);
    }
    
    saveToStorage('searchAreas', searchAreas);
    addAuditEntry('Search Area Activated', `Template ${template.name} activated`, currentUser.id);
    
    loadSearchAreas();
    updatePersonalKPIs();
    
    showToast(`${template.name} search area activated`, 'success');
}

window.deactivateTemplate = function(templateId) {
    if (!checkPermission('search_areas.edit')) return;
    
    const area = searchAreas.find(a => a.id === templateId);
    if (!area) return;
    
    area.isActive = false;
    saveToStorage('searchAreas', searchAreas);
    
    addAuditEntry('Search Area Deactivated', `${area.name} deactivated`, currentUser.id);
    
    loadSearchAreas();
    updatePersonalKPIs();
    
    showToast(`${area.name} search area deactivated`, 'success');
}

// User Management Functions
function loadUsers() {
    console.log('Loading users...');
    renderUsersGrid();
}

function renderUsersGrid() {
    const container = document.getElementById('usersGrid');
    if (!container) return;
    
    container.innerHTML = '';
    
    const filteredUsers = getFilteredUsers();
    
    filteredUsers.forEach(user => {
        const userCard = createUserCard(user);
        container.appendChild(userCard);
    });
}

function getFilteredUsers() {
    const searchElement = document.getElementById('userSearch');
    const roleFilterElement = document.getElementById('roleFilter');
    
    const search = searchElement ? searchElement.value.toLowerCase() : '';
    const roleFilter = roleFilterElement ? roleFilterElement.value : '';
    
    return users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(search) ||
                            user.email.toLowerCase().includes(search) ||
                            user.department.toLowerCase().includes(search);
        const matchesRole = !roleFilter || user.role === roleFilter;
        
        return matchesSearch && matchesRole;
    });
}

function createUserCard(user) {
    const card = document.createElement('div');
    card.className = 'user-card fade-in';
    
    const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
    const loginText = lastLogin ? (() => {
        const daysSinceLogin = Math.floor((Date.now() - lastLogin) / (1000 * 60 * 60 * 24));
        return daysSinceLogin === 0 ? 'Today' :
               daysSinceLogin === 1 ? 'Yesterday' :
               `${daysSinceLogin} days ago`;
    })() : 'Never';
    
    card.innerHTML = `
        <div class="user-card-header">
            <div class="user-card-avatar">${user.avatar}</div>
            <div class="user-card-info">
                <div class="user-card-name">${user.name}</div>
                <div class="user-card-role">
                    <span class="role-badge role-badge--${user.role.toLowerCase().replace(' ', '-')}">${user.role}</span>
                </div>
            </div>
        </div>
        <div class="user-card-meta">
            <div class="user-meta-item">
                <div class="user-meta-label">Department</div>
                <div class="user-meta-value">${user.department}</div>
            </div>
            <div class="user-meta-item">
                <div class="user-meta-label">Last Login</div>
                <div class="user-meta-value">${loginText}</div>
            </div>
            <div class="user-meta-item">
                <div class="user-meta-label">Status</div>
                <div class="user-meta-value">
                    <span class="status-badge status-badge--${user.status}">${user.status}</span>
                </div>
            </div>
            <div class="user-meta-item">
                <div class="user-meta-label">Search Areas</div>
                <div class="user-meta-value">${user.searchAreasSubscribed}</div>
            </div>
        </div>
        <div class="user-card-actions">
            <button class="btn btn--outline btn--sm" onclick="editUser(${user.id})" ${!hasPermission('users.edit') ? 'disabled' : ''}>Edit</button>
            <button class="btn btn--outline btn--sm" onclick="toggleUserStatus(${user.id})" ${!hasPermission('users.edit') ? 'disabled' : ''}>${user.status === 'active' ? 'Deactivate' : 'Activate'}</button>
            ${hasPermission('users.delete') ? `<button class="btn btn--outline btn--sm" onclick="deleteUser(${user.id})" style="color: var(--color-error);">Delete</button>` : ''}
        </div>
    `;
    
    return card;
}

function filterUsers() {
    renderUsersGrid();
}

// Global user management functions
window.editUser = function(userId) {
    if (!checkPermission('users.edit')) return;
    showToast('User editing functionality would be implemented here', 'info');
}

window.toggleUserStatus = function(userId) {
    if (!checkPermission('users.edit')) return;
    
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    user.status = user.status === 'active' ? 'inactive' : 'active';
    saveToStorage('users', users);
    
    addAuditEntry('User Status Changed', `${user.name} status changed to ${user.status}`, currentUser.id);
    renderUsersGrid();
    
    showToast(`User ${user.status === 'active' ? 'activated' : 'deactivated'}`, 'success');
}

window.deleteUser = function(userId) {
    if (!checkPermission('users.delete')) return;
    
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
        const index = users.findIndex(u => u.id === userId);
        users.splice(index, 1);
        saveToStorage('users', users);
        
        addAuditEntry('User Deleted', `User ${user.name} deleted`, currentUser.id);
        renderUsersGrid();
        
        showToast('User deleted successfully', 'success');
    }
}

// RFP Management Functions
function loadRFPs() {
    console.log('Loading RFPs...');
    updateRFPFilters();
    renderRFPsTable();
}

function updateRFPFilters() {
    const areaFilter = document.getElementById('rfpAreaFilter');
    if (!areaFilter) return;
    
    const currentValue = areaFilter.value;
    areaFilter.innerHTML = '<option value="">All Areas</option>';
    
    const areas = [...new Set(searchAreas.filter(a => a.isActive).map(a => a.name))];
    areas.forEach(area => {
        const option = document.createElement('option');
        option.value = area;
        option.textContent = area;
        areaFilter.appendChild(option);
    });
    
    areaFilter.value = currentValue;
}

function renderRFPsTable() {
    const tbody = document.getElementById('rfpsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const filteredRFPs = getFilteredRFPs();
    
    filteredRFPs.forEach(rfp => {
        const row = createRFPRow(rfp);
        tbody.appendChild(row);
    });
}

function getFilteredRFPs() {
    const searchElement = document.getElementById('rfpSearch');
    const areaFilterElement = document.getElementById('rfpAreaFilter');
    const statusFilterElement = document.getElementById('rfpStatusFilter');
    
    const search = searchElement ? searchElement.value.toLowerCase() : '';
    const areaFilter = areaFilterElement ? areaFilterElement.value : '';
    const statusFilter = statusFilterElement ? statusFilterElement.value : '';
    
    return rfps.filter(rfp => {
        const matchesSearch = rfp.title.toLowerCase().includes(search) ||
                            rfp.entity.toLowerCase().includes(search);
        const matchesArea = !areaFilter || rfp.technologyArea === areaFilter;
        const matchesStatus = !statusFilter || rfp.status === statusFilter;
        
        return matchesSearch && matchesArea && matchesStatus;
    });
}

function createRFPRow(rfp) {
    const row = document.createElement('tr');
    const statusClass = rfp.status.toLowerCase().replace(' ', '-');
    
    row.innerHTML = `
        <td><input type="checkbox" class="rfp-checkbox" data-id="${rfp.id}"></td>
        <td><strong>${rfp.title}</strong></td>
        <td>${rfp.entity}</td>
        <td>${rfp.technologyArea}</td>
        <td>${rfp.value}</td>
        <td>${new Date(rfp.datePosted).toLocaleDateString()}</td>
        <td>${new Date(rfp.closingDate).toLocaleDateString()}</td>
        <td><span class="status-badge status-badge--${statusClass}">${rfp.status}</span></td>
        <td>
            <div class="table-actions">
                <button class="btn btn--outline btn--sm" onclick="updateRFPStatus(${rfp.id}, 'Reviewing')" ${!hasPermission('rfps.edit') ? 'disabled' : ''}>Review</button>
                <button class="btn btn--outline btn--sm" onclick="updateRFPStatus(${rfp.id}, 'Tracked')" ${!hasPermission('rfps.edit') ? 'disabled' : ''}>Track</button>
            </div>
        </td>
    `;
    
    return row;
}

function filterRFPs() {
    renderRFPsTable();
}

function handleSelectAllRFPs(e) {
    const isChecked = e.target.checked;
    document.querySelectorAll('.rfp-checkbox').forEach(checkbox => {
        checkbox.checked = isChecked;
    });
}

// Global RFP functions
window.updateRFPStatus = function(rfpId, newStatus) {
    if (!checkPermission('rfps.edit')) return;
    
    const rfp = rfps.find(r => r.id === rfpId);
    if (!rfp) return;
    
    const oldStatus = rfp.status;
    rfp.status = newStatus;
    saveToStorage('rfps', rfps);
    
    addAuditEntry('RFP Status Updated', `"${rfp.title}" status changed from ${oldStatus} to ${newStatus}`, currentUser.id);
    renderRFPsTable();
    
    showToast(`RFP marked as ${newStatus}`, 'success');
}

// Audit Log Functions
function loadAuditLog() {
    console.log('Loading audit log...');
    renderAuditLog();
}

function renderAuditLog() {
    const container = document.getElementById('auditLog');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (auditLog.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary); padding: 2rem;">No audit entries found.</p>';
        return;
    }
    
    auditLog.slice(0, 50).forEach(entry => { // Show last 50 entries
        const entryElement = createAuditEntryElement(entry);
        container.appendChild(entryElement);
    });
}

function createAuditEntryElement(entry) {
    const element = document.createElement('div');
    element.className = 'audit-entry fade-in';
    
    const user = users.find(u => u.id === entry.userId);
    const userName = user ? user.name : 'System';
    const timestamp = new Date(entry.timestamp).toLocaleString();
    
    element.innerHTML = `
        <div class="audit-entry-header">
            <div class="audit-entry-action">${entry.action}</div>
            <div class="audit-entry-time">${timestamp}</div>
        </div>
        <div class="audit-entry-details">${entry.details}</div>
        <div class="audit-entry-user">by ${userName}</div>
    `;
    
    return element;
}

// Profile Functions
function loadProfile() {
    if (!currentUser) return;
    
    const nameField = document.getElementById('profileFullName');
    const emailField = document.getElementById('profileEmail');
    const departmentField = document.getElementById('profileDepartment');
    
    if (nameField) nameField.value = currentUser.name;
    if (emailField) emailField.value = currentUser.email;
    if (departmentField) departmentField.value = currentUser.department;
}

function updateUserProfile() {
    if (!currentUser) return;
    
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userRole = document.getElementById('userRole');
    
    if (userAvatar) userAvatar.textContent = currentUser.avatar;
    if (userName) userName.textContent = currentUser.name;
    if (userRole) userRole.textContent = currentUser.role;
}

function updateLastSyncTime() {
    const element = document.getElementById('lastSyncTime');
    if (!element || !lastSyncTime) return;
    
    const syncDate = new Date(lastSyncTime);
    const now = new Date();
    const diffMinutes = Math.floor((now - syncDate) / (1000 * 60));
    
    let timeText;
    if (diffMinutes < 1) {
        timeText = 'Just now';
    } else if (diffMinutes < 60) {
        timeText = `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
        const diffHours = Math.floor(diffMinutes / 60);
        timeText = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }
    
    element.textContent = `Last sync: ${timeText}`;
}

// Modal Management Functions
function setupUserInviteModal() {
    const modal = document.getElementById('userInviteModal');
    const closeBtn = document.getElementById('closeUserInviteModal');
    const cancelBtn = document.getElementById('cancelUserInviteModal');
    const form = document.getElementById('userInviteForm');
    
    if (closeBtn) closeBtn.addEventListener('click', () => hideModal('userInviteModal'));
    if (cancelBtn) cancelBtn.addEventListener('click', () => hideModal('userInviteModal'));
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleUserInvite();
        });
    }
}

function setupSearchAreaModal() {
    const modal = document.getElementById('searchAreaModal');
    const closeBtn = document.getElementById('closeSearchAreaModal');
    const cancelBtn = document.getElementById('cancelSearchAreaModal');
    const form = document.getElementById('searchAreaForm');
    
    if (closeBtn) closeBtn.addEventListener('click', () => hideModal('searchAreaModal'));
    if (cancelBtn) cancelBtn.addEventListener('click', () => hideModal('searchAreaModal'));
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleSearchAreaSave();
        });
    }
}

function showUserInviteModal() {
    if (!checkPermission('users.invite')) return;
    showModal('userInviteModal');
}

function showSearchAreaModal() {
    if (!checkPermission('search_areas.create')) return;
    showModal('searchAreaModal');
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('hidden');
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
}

function handleUserInvite() {
    const email = document.getElementById('inviteEmail').value.trim();
    const role = document.getElementById('inviteRole').value;
    const department = document.getElementById('inviteDepartment').value.trim();
    const message = document.getElementById('inviteMessage').value.trim();
    
    if (!email || !role) {
        showToast('Please fill in required fields', 'error');
        return;
    }
    
    // Check if user already exists
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        showToast('User with this email already exists', 'error');
        return;
    }
    
    // Simulate sending invitation
    const newUser = {
        id: users.length + 1,
        name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        email: email.toLowerCase(),
        department: department || 'Unassigned',
        role,
        avatar: '👤',
        status: 'invited',
        lastLogin: null,
        createdAt: new Date().toISOString(),
        searchAreasSubscribed: 0,
        timezone: 'America/Toronto',
        onboardingCompleted: false,
        preferences: {
            emailNotifications: true,
            instantAlerts: false,
            weeklyReports: true,
            dashboardLayout: 'default'
        }
    };
    
    users.push(newUser);
    saveToStorage('users', users);
    
    addAuditEntry('User Invited', `Invitation sent to ${email} for role ${role}`, currentUser.id);
    
    hideModal('userInviteModal');
    document.getElementById('userInviteForm').reset();
    
    if (document.getElementById('users').classList.contains('active')) {
        renderUsersGrid();
    }
    
    showToast('User invitation sent successfully', 'success');
}

function handleSearchAreaSave() {
    const name = document.getElementById('areaName').value.trim();
    const category = document.getElementById('areaCategory').value;
    const keywords = document.getElementById('areaKeywords').value.trim();
    const description = document.getElementById('areaDescription').value.trim();
    
    if (!name || !category || !keywords) {
        showToast('Please fill in required fields', 'error');
        return;
    }
    
    const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k);
    
    const newArea = {
        id: `custom_${Date.now()}`,
        name,
        category,
        icon: '🔍',
        description: description || `Custom search area for ${name}`,
        keywords: keywordArray,
        subcategories: [],
        isActive: true,
        isTemplate: false,
        createdBy: currentUser.name,
        createdAt: new Date().toISOString(),
        subscribers: [currentUser.id],
        rfpCount: 0,
        lastMatch: null
    };
    
    searchAreas.push(newArea);
    saveToStorage('searchAreas', searchAreas);
    
    addAuditEntry('Search Area Created', `Custom search area "${name}" created`, currentUser.id);
    
    hideModal('searchAreaModal');
    document.getElementById('searchAreaForm').reset();
    
    if (document.getElementById('search-areas').classList.contains('active')) {
        loadSearchAreas();
    }
    
    showToast('Search area created successfully', 'success');
}

// System Functions
function exportAllData() {
    if (!checkPermission('system.manage')) return;
    
    const data = {
        entities,
        rfps,
        searchAreas,
        users: users.map(u => ({ ...u, password: undefined })), // Remove passwords
        auditLog: auditLog.slice(0, 1000), // Limit audit log size
        exportDate: new Date().toISOString(),
        version: APP_CONFIG.version
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rfp-platform-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    addAuditEntry('Data Export', 'System data exported', currentUser.id);
    showToast('Data exported successfully', 'success');
}

function backupSystemData() {
    if (!checkPermission('system.manage')) return;
    
    // This would normally backup to cloud storage
    showToast('Creating system backup...', 'info');
    
    setTimeout(() => {
        addAuditEntry('System Backup', 'System backup created', currentUser.id);
        showToast('System backup created successfully', 'success');
    }, 2000);
}

function clearApplicationCache() {
    if (!checkPermission('system.manage')) return;
    
    if (confirm('Are you sure you want to clear the application cache? This will not delete your data but may require reloading.')) {
        // Clear browser cache
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            });
        }
        
        // Clear temporary data
        const keysToKeep = ['entities', 'rfps', 'searchAreas', 'users', 'auditLog', 'userPreferences', 'currentUser'];
        Object.keys(localStorage).forEach(key => {
            if (!keysToKeep.includes(key)) {
                localStorage.removeItem(key);
            }
        });
        
        addAuditEntry('Cache Cleared', 'Application cache cleared', currentUser.id);
        showToast('Cache cleared successfully', 'success');
    }
}

// Utility Functions
function addAuditEntry(action, details, userId = null) {
    const entry = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        action,
        details,
        userId: userId || (currentUser ? currentUser.id : 'System')
    };
    
    auditLog.unshift(entry);
    
    // Keep only latest entries
    if (auditLog.length > APP_CONFIG.maxAuditEntries) {
        auditLog = auditLog.slice(0, APP_CONFIG.maxAuditEntries);
    }
    
    saveToStorage('auditLog', auditLog);
}

function showToast(message, type = 'info') {
    console.log(`Toast: [${type.toUpperCase()}] ${message}`);
    
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<div>${message}</div>`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, 3000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showProgress(text = 'Loading...', progress = 0) {
    const indicator = document.getElementById('progressIndicator');
    const textEl = indicator?.querySelector('.progress-text');
    const fillEl = indicator?.querySelector('.progress-fill');
    
    if (indicator && textEl && fillEl) {
        textEl.textContent = text;
        fillEl.style.width = `${progress}%`;
        indicator.classList.remove('hidden');
    }
}

function hideProgress() {
    const indicator = document.getElementById('progressIndicator');
    if (indicator) indicator.classList.add('hidden');
}

// Placeholder function
function showTemplatesDialog() {
    showToast('Template management dialog would open here', 'info');
}

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Application error:', e.error);
    showToast('An unexpected error occurred', 'error');
    
    if (currentUser) {
        addAuditEntry('System Error', `Error: ${e.error.message}`, currentUser.id);
    }
});

console.log('Universal RFP Monitoring Platform loaded successfully');