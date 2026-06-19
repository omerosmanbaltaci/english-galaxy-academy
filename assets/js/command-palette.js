/* ==========================================================================
   English Galaxy Academy - Notion Style Command Palette
   ========================================================================== */

   const cpHTML = `
   <div id="cmd-palette-overlay" class="cmd-palette-overlay" style="display: none;">
       <div class="cmd-palette" id="cmd-palette">
           <div class="cmd-header">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
               <input type="text" id="cmd-input" data-i18n="cmd_placeholder" placeholder="Search lessons, units, vocabulary..." autocomplete="off" spellcheck="false">
               <div class="cmd-badge" data-i18n="cmd_esc">ESC to close</div>
           </div>
           <div class="cmd-results" id="cmd-results">
               <div class="cmd-empty" data-i18n="cmd_empty">Type to start searching...</div>
           </div>
       </div>
   </div>
   `;
   
   // Inject DOM
   document.body.insertAdjacentHTML('beforeend', cpHTML);
   
   const cpOverlay = document.getElementById('cmd-palette-overlay');
   const cpInput = document.getElementById('cmd-input');
   const cpResults = document.getElementById('cmd-results');
   
   let cmdResources = [];
   let selectedIndex = -1;
   
   // Load data
   fetch('/api/lessons')
       .then(res => res.json())
       .then(data => { cmdResources = data; })
       .catch(err => console.log('Cmd Palette: Error loading resources', err));
   
   // Open Palette
   window.openCommandPalette = function() {
       cpOverlay.style.display = 'flex';
       setTimeout(() => cpInput.focus(), 50);
       document.body.style.overflow = 'hidden'; // prevent bg scroll
       renderCmdResults('');
   };
   
   // Close Palette
   window.closeCommandPalette = function() {
       cpOverlay.style.display = 'none';
       cpInput.value = '';
       document.body.style.overflow = '';
       selectedIndex = -1;
   };
   
   // Keyboard Shortcuts
   document.addEventListener('keydown', (e) => {
       // Ctrl+K or Cmd+K
       if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
           e.preventDefault();
           openCommandPalette();
       }
       // ESC
       if (e.key === 'Escape' && cpOverlay.style.display === 'flex') {
           closeCommandPalette();
       }
   });
   
   cpOverlay.addEventListener('mousedown', (e) => {
       if (e.target === cpOverlay) closeCommandPalette();
   });
   
   // Search Logic
   cpInput.addEventListener('input', (e) => {
       renderCmdResults(e.target.value.trim().toLowerCase());
   });
   
   // Navigation Logic
   cpInput.addEventListener('keydown', (e) => {
       const items = cpResults.querySelectorAll('.cmd-item');
       if (items.length === 0) return;
   
       if (e.key === 'ArrowDown') {
           e.preventDefault();
           selectedIndex = (selectedIndex + 1) % items.length;
           updateSelection(items);
       } else if (e.key === 'ArrowUp') {
           e.preventDefault();
           selectedIndex = (selectedIndex - 1 + items.length) % items.length;
           updateSelection(items);
       } else if (e.key === 'Enter') {
           e.preventDefault();
           if (selectedIndex >= 0 && selectedIndex < items.length) {
               items[selectedIndex].click();
           } else if (items.length > 0) {
               items[0].click();
           }
       }
   });
   
   function updateSelection(items) {
       items.forEach((item, index) => {
           if (index === selectedIndex) {
               item.classList.add('selected');
               item.scrollIntoView({ block: 'nearest' });
           } else {
               item.classList.remove('selected');
           }
       });
   }
   
      function renderCmdResults(query) {
        selectedIndex = -1;
        if (!query) {
            cpResults.innerHTML = '<div class="cmd-empty" data-i18n="cmd_typing">Start typing to search across the entire curriculum...</div>';
            if (window.applyTranslations) window.applyTranslations();
            return;
        }
   
       const matches = cmdResources.filter(r => 
           r.title.toLowerCase().includes(query) || 
           (r.description && r.description.toLowerCase().includes(query)) ||
           r.unit.toLowerCase().includes(query) ||
           r.grade.toLowerCase().includes(query)
       ).slice(0, 10); // Limit to top 10
          if (matches.length === 0) {
            cpResults.innerHTML = '<div class="cmd-empty" data-i18n="cmd_no_results">No results found. Try a different keyword.</div>';
            if (window.applyTranslations) window.applyTranslations();
            return;
        }
   
       cpResults.innerHTML = matches.map((m, i) => {
           // Icon based on type
           let icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>';
           if(m.type === 'lesson') icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
           
           // Resolve path relative to current page
           const prefix = (typeof getPathPrefix === 'function') ? getPathPrefix() : './';
           let link = `${prefix}viewer.html?id=${m.id}`;
           if(m.type === 'lesson') {
               link = `${prefix}unit.html?grade=${m.grade}&unit=${m.unit}`;
           }
   
           const badgeColor = m.grade.includes('primary') || m.grade.match(/grade-[2-4]/) ? '#ff6b6b' : 
                              m.grade.includes('middle') || m.grade.match(/grade-[5-8]/) ? '#4dabf7' : '#51cf66';
   
           return `
               <a href="${link}" class="cmd-item ${i === 0 ? 'selected' : ''}">
                   <div class="cmd-item-icon">${icon}</div>
                   <div class="cmd-item-content">
                       <div class="cmd-item-title">${m.title}</div>
                       <div class="cmd-item-meta">${m.grade.replace('-', ' ').toUpperCase()} • ${m.unit.replace('-', ' ').toUpperCase()}</div>
                   </div>
                   <div class="cmd-item-badge" style="background:${badgeColor}15; color:${badgeColor}">${m.type}</div>
               </a>
           `;
        }).join('');
        
        if(matches.length > 0) selectedIndex = 0;
        if (window.applyTranslations) window.applyTranslations();
    }
