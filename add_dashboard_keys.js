
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.join(__dirname, 'src', 'locales');

const newKeys = {
    admin: {
        dashboard_title: "Admin Dashboard",
        tabs: {
            menu: "Menu",
            decks: "Decks",
            users: "Users",
            tickets: "Tickets"
        },
        data_management: {
            title: "Data Management",
            subtitle: "Backup and restore your application data.",
            export: "Export Backup",
            export_desc: "Download all data as JSON",
            import: "Import Backup",
            import_desc: "Restore from JSON file",
            warning_title: "Important Note:",
            warning_desc: "Importing data will <strong>overwrite</strong> all current decks, cards, users, and settings. This action cannot be undone."
        },
        users: {
            title: "User Database",
            subtitle: "Manage access and roles",
            merge_btn: "Merge Users",
            add_btn: "Add User",
            table: {
                user: "User",
                role: "Role",
                progress: "Progress",
                actions: "Actions",
                empty: "No users found."
            },
            delete_confirm: "Delete User"
        },
        system: {
            title: "System Configuration",
            api_keys: "Backend API Keys",
            gemini_label: "Google Gemini API Key",
            gemini_placeholder: "Enter backend API Key",
            gemini_hint: "This key is required for all AI generation features. It is stored securely in local storage but only accessible here."
        }
    },
    tutor: {
        dashboard_title: "Tutor Dashboard",
        tabs: {
            overview: "Overview",
            students: "Students",
            flashcards: "Flashcards"
        },
        stats: {
            total_students: "Total Students",
            active_students: "Active Students",
            archived_students: "Archived Students"
        },
        actions: {
            add_student: "Add New Student",
            manage_content: "Manage Learning Content"
        },
        toggle: {
            active: "Active",
            archived: "Archived"
        }
    }
};

// Translations (Simplified for now - using English as base for others to avoid blocking, 
// in a real scenario these would be machine translated or provided)
// I will actually provide approximate translations to be helpful.

const translations = {
    es: {
        admin: {
            dashboard_title: "Panel de Administración",
            tabs: { menu: "Menú", decks: "Mazos", users: "Usuarios", tickets: "Tickets" },
            data_management: {
                title: "Gestión de Datos", subtitle: "Copia de seguridad y restauración de datos.",
                export: "Exportar Copia", export_desc: "Descargar todo como JSON",
                import: "Importar Copia", import_desc: "Restaurar desde archivo JSON",
                warning_title: "Nota Importante:", warning_desc: "Importar datos sobrescribirá todos los mazos, tarjetas y usuarios actuales. No se puede deshacer."
            },
            users: {
                title: "Base de Datos de Usuarios", subtitle: "Gestionar acceso y roles",
                merge_btn: "Fusionar Usuarios", add_btn: "Añadir Usuario",
                table: { user: "Usuario", role: "Rol", progress: "Progreso", actions: "Acciones", empty: "No se encontraron usuarios." },
                delete_confirm: "Eliminar Usuario"
            },
            system: {
                title: "Configuración del Sistema", api_keys: "Claves API Backend",
                gemini_label: "Clave API Google Gemini", gemini_placeholder: "Ingrese Clave API",
                gemini_hint: "Esta clave es necesaria para las funciones de IA. Se almacena de forma segura localmente."
            }
        },
        tutor: {
            dashboard_title: "Panel del Tutor",
            tabs: { overview: "Resumen", students: "Estudiantes", flashcards: "Tarjetas" },
            stats: { total_students: "Total Estudiantes", active_students: "Estudiantes Activos", archived_students: "Estudiantes Archivados" },
            actions: { add_student: "Añadir Nuevo Estudiante", manage_content: "Gestionar Contenido" },
            toggle: { active: "Activo", archived: "Archivado" }
        }
    },
    fr: {
        admin: {
            dashboard_title: "Tableau de Bord Admin",
            tabs: { menu: "Menu", decks: "Paquets", users: "Utilisateurs", tickets: "Tickets" },
            data_management: {
                title: "Gestion des Données", subtitle: "Sauvegarde et restauration des données.",
                export: "Exporter", export_desc: "Tout télécharger en JSON",
                import: "Importer", import_desc: "Restaurer depuis un fichier JSON",
                warning_title: "Note Importante:", warning_desc: "L'importation écrasera toutes les données actuelles. Cette action est irréversible."
            },
            users: {
                title: "Base de Données Utilisateurs", subtitle: "Gérer les accès et rôles",
                merge_btn: "Fusionner", add_btn: "Ajouter Utilisateur",
                table: { user: "Utilisateur", role: "Rôle", progress: "Progrès", actions: "Actions", empty: "Aucun utilisateur trouvé." },
                delete_confirm: "Supprimer Utilisateur"
            },
            system: {
                title: "Configuration Système", api_keys: "Clés API Backend",
                gemini_label: "Clé API Google Gemini", gemini_placeholder: "Entrer Clé API",
                gemini_hint: "Cette clé est requise pour l'IA. Elle est stockée localement de manière sécurisée."
            }
        },
        tutor: {
            dashboard_title: "Tableau de Bord Tuteur",
            tabs: { overview: "Aperçu", students: "Étudiants", flashcards: "Cartes" },
            stats: { total_students: "Total Étudiants", active_students: "Étudiants Actifs", archived_students: "Étudiants Archivés" },
            actions: { add_student: "Ajouter Étudiant", manage_content: "Gérer le Contenu" },
            toggle: { active: "Actif", archived: "Archivé" }
        }
    },
    pt: {
        admin: {
            dashboard_title: "Painel de Administração",
            tabs: { menu: "Menu", decks: "Baralhos", users: "Usuários", tickets: "Tickets" },
            data_management: {
                title: "Gerenciamento de Dados", subtitle: "Backup e restauração de dados.",
                export: "Exportar Backup", export_desc: "Baixar tudo como JSON",
                import: "Importar Backup", import_desc: "Restaurar de arquivo JSON",
                warning_title: "Nota Importante:", warning_desc: "A importação substituirá todos os dados atuais. Esta ação não pode ser desfeita."
            },
            users: {
                title: "Banco de Dados de Usuários", subtitle: "Gerenciar acesso e funções",
                merge_btn: "Mesclar Usuários", add_btn: "Adicionar Usuário",
                table: { user: "Usuário", role: "Função", progress: "Progresso", actions: "Ações", empty: "Nenhum usuário encontrado." },
                delete_confirm: "Excluir Usuário"
            },
            system: {
                title: "Configuração do Sistema", api_keys: "Chaves de API Backend",
                gemini_label: "Chave API Google Gemini", gemini_placeholder: "Inserir Chave API",
                gemini_hint: "Esta chave é necessária para recursos de IA. Armazenada localmente com segurança."
            }
        },
        tutor: {
            dashboard_title: "Painel do Tutor",
            tabs: { overview: "Visão Geral", students: "Alunos", flashcards: "Cartões" },
            stats: { total_students: "Total de Alunos", active_students: "Alunos Ativos", archived_students: "Alunos Arquivados" },
            actions: { add_student: "Adicionar Novo Aluno", manage_content: "Gerenciar Conteúdo" },
            toggle: { active: "Ativo", archived: "Arquivado" }
        }
    },
    it: {
        admin: {
            dashboard_title: "Pannello di Amministrazione",
            tabs: { menu: "Menu", decks: "Mazzi", users: "Utenti", tickets: "Ticket" },
            data_management: {
                title: "Gestione Dati", subtitle: "Backup e ripristino dei dati.",
                export: "Esporta Backup", export_desc: "Scarica tutto come JSON",
                import: "Importa Backup", import_desc: "Ripristina da file JSON",
                warning_title: "Nota Importante:", warning_desc: "L'importazione sovrascriverà tutti i dati attuali. Questa azione non può essere annullata."
            },
            users: {
                title: "Database Utenti", subtitle: "Gestisci accessi e ruoli",
                merge_btn: "Unisci Utenti", add_btn: "Aggiungi Utente",
                table: { user: "Utente", role: "Ruolo", progress: "Progresso", actions: "Azioni", empty: "Nessun utente trovato." },
                delete_confirm: "Elimina Utente"
            },
            system: {
                title: "Configurazione Sistema", api_keys: "Chiavi API Backend",
                gemini_label: "Chiave API Google Gemini", gemini_placeholder: "Inserisci Chiave API",
                gemini_hint: "Questa chiave è richiesta per le funzionalità AI. È memorizzata in modo sicuro localmente."
            }
        },
        tutor: {
            dashboard_title: "Pannello Tutor",
            tabs: { overview: "Panoramica", students: "Studenti", flashcards: "Carte" },
            stats: { total_students: "Totale Studenti", active_students: "Studenti Attivi", archived_students: "Studenti Archiviati" },
            actions: { add_student: "Aggiungi Nuovo Studente", manage_content: "Gestisci Contenuti" },
            toggle: { active: "Attivo", archived: "Archiviato" }
        }
    },
    // Adding placeholder for other languages (hi, zh, ja, ko, uk) using English for now to avoid errors
    // The user can refine these later or I can run a separate pass.
    hi: getEnglishCopy(),
    zh: getEnglishCopy(),
    ja: getEnglishCopy(),
    ko: getEnglishCopy(),
    uk: getEnglishCopy()
};

function getEnglishCopy() {
    return {
        admin: newKeys.admin,
        tutor: newKeys.tutor
    };
}

const fileNames = fs.readdirSync(localesDir);

fileNames.forEach(fileName => {
    const langCode = path.basename(fileName, '.json');
    if (langCode === 'en') {
        updateFile(fileName, { admin: newKeys.admin, tutor: newKeys.tutor });
    } else if (translations[langCode]) {
        updateFile(fileName, translations[langCode]);
    } else {
        // Fallback to English for unknown languages to prevent missing keys
        updateFile(fileName, { admin: newKeys.admin, tutor: newKeys.tutor });
    }
});

function updateFile(fileName, newData) {
    const filePath = path.join(localesDir, fileName);
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const jsonContent = JSON.parse(fileContent);

        // Merge new keys
        jsonContent.admin = { ...(jsonContent.admin || {}), ...newData.admin };
        jsonContent.tutor = { ...(jsonContent.tutor || {}), ...newData.tutor };

        fs.writeFileSync(filePath, JSON.stringify(jsonContent, null, 4));
        console.log(`Updated ${fileName} with admin/tutor keys`);
    } catch (error) {
        console.error(`Error updating ${fileName}:`, error);
    }
}
