(() => {
  'use strict';
  document.getElementById('themeButton').addEventListener('click',()=>AppAppearance.apply(document.body.dataset.theme==='light'?'dark':'light'));
  for(const button of document.querySelectorAll('[data-coming-soon]'))button.addEventListener('click',()=>{
    document.getElementById('pathAnnouncement').textContent=button.dataset.comingSoon+' lessons are coming soon.';
  });
})();
