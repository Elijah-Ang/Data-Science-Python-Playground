/* Stable figure geometry, accessible in-page inspection and native per-figure sharing. */
window.sizeChartImage = (image, url) => {
  try {
    const bytes=Uint8Array.from(atob(url.split(',')[1].slice(0,44)),character=>character.charCodeAt(0));
    const view=new DataView(bytes.buffer);image.width=view.getUint32(16);image.height=view.getUint32(20);
  } catch {}
};
document.addEventListener('click', async event => {
  const link=event.target.closest?.('a[href^="data:image/"]');
  if (!link) return;
  if (link.hasAttribute('download') && window.AppPlatform?.native) {
    event.preventDefault();
    try {await AppPlatform.shareDataUrl(link.href,link.download,'Figure from last executed code');}
    catch {const note=document.createElement('p');note.setAttribute('role','status');note.textContent='Share dismissed or unavailable. The figure remains in your notebook.';link.after(note);}
    return;
  }
  if (!/^Open .*larger$/.test(link.textContent.trim())) return;
  event.preventDefault();
  const dialog=document.createElement('dialog');dialog.className='figure-dialog';dialog.setAttribute('aria-label','Inspect figure');
  const close=document.createElement('button');close.textContent='Close figure';close.type='button';
  const label=document.createElement('label');label.textContent='Figure zoom ';
  const zoom=document.createElement('input');zoom.type='range';zoom.min='0.25';zoom.max='3';zoom.step='0.25';zoom.value='1';zoom.setAttribute('aria-label','Figure zoom');label.append(zoom);
  const view=document.createElement('div');view.className='figure-pan';view.tabIndex=0;view.setAttribute('aria-label','Figure; scroll horizontally and vertically to inspect');
  const image=document.createElement('img');image.src=link.href;image.alt=link.closest('.chart-wrap')?.querySelector('img')?.alt || 'Figure from the last executed code';sizeChartImage(image,link.href);
  const width=image.width || 900;image.style.width=width+'px';view.append(image);dialog.append(close,label,view);document.body.append(dialog);
  zoom.addEventListener('input',()=>{image.style.width=(width*Number(zoom.value))+'px';});
  close.addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{dialog.remove();link.focus();});dialog.showModal();close.focus();
});
