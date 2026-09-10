// Preserve Eric's existing page bookmarks and invitation fragments on the same origin.
(()=>{const h=location.hash;if(/^#(?:arrival|atlas|hold|fieldbook)(?:$|[?&])/.test(h)||/^#(?:invite|shelf)=/.test(h)){location.replace('./portal/'+location.search+h)}})();
