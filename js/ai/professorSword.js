import { PromptTemplates } from './promptTemplates.js';
import { TeachingModes } from './teachingModes.js';
import { QuickActions } from './quickActions.js';
import { insertPromptIntoInput, ensureConversationHasStarter } from './aiService.js';
import { renderToolbar, setupToolbarDelegation } from '../ui/toolbar.js';

function initProfessorSwordWorkspace() {
    const panel = document.getElementById('aiMentorCard');
    if (!panel) return;

    const teachingContainer = document.getElementById('teachingModesToolbar');
    const quickContainer = document.getElementById('quickActionsToolbar');

    renderToolbar(teachingContainer, TeachingModes, 'Teaching Mode');
    renderToolbar(quickContainer, QuickActions, 'Quick Action');

    setupToolbarDelegation(panel, {
        onPromptSelected: (promptId) => {
            const template = PromptTemplates[promptId] || '';
            if (!template) return;
            insertPromptIntoInput(template, '#aiInput');
        }
    });

    ensureConversationHasStarter('#aiMessages');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProfessorSwordWorkspace);
} else {
    initProfessorSwordWorkspace();
}

export { initProfessorSwordWorkspace };
