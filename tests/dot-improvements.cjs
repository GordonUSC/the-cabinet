const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const path=require('path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'cabinet-20261003.js'),'utf8').split('const routes=')[0];
let checks=0;function test(name,run){run();checks++;console.log('PASS '+name)}
function element(extra={}){return Object.assign({hidden:false,textContent:'',value:'',events:{},addEventListener(type,fn){this.events[type]=fn},focus(){this.focused=true}},extra)}
const projects=[...html.matchAll(/<li class="project" data-stage="([^"]+)" data-search="([^"]*)">([\s\S]*?)<\/li>/g)].map(m=>element({dataset:{stage:m[1],search:m[2]},textContent:m[3].replace(/<[^>]*>/g,' ')}));
const els={'#search':element(),'#room':element({value:'all',options:[...html.matchAll(/<option value="([^"]+)">/g)].map(m=>({value:m[1]}))}),'#clear-filters':element(),'#results':element(),'#empty':element(),'#project-total':element(),'#footer-total':element()};
const events={},location={href:'https://gordonusc.github.io/the-cabinet/?for=cale&q=dodgeball&room=stadium#projects'};Object.defineProperty(location,'search',{get(){return new URL(this.href).search}});
const context={document:{querySelector:s=>els[s],querySelectorAll:s=>projects},location,URL,URLSearchParams,history:{replaceState(_a,_b,url){location.href=String(url)}},addEventListener:(type,fn)=>events[type]=fn};
vm.runInNewContext(js,context);
const visible=()=>projects.filter(p=>!p.hidden);
test('44 real cards drive both directory totals',()=>{assert.equal(projects.length,44);assert.equal(els['#project-total'].textContent,44);assert.equal(els['#footer-total'].textContent,44)});
test('bookmark restores a single FINAL BOSS result',()=>{assert.equal(visible().length,1);assert.match(visible()[0].textContent,/FINAL BOSS/);assert.equal(els['#results'].textContent,'1 project')});
test('clear removes filters but preserves invitation and anchor',()=>{els['#clear-filters'].events.click();assert.equal(visible().length,44);assert.equal(location.href,'https://gordonusc.github.io/the-cabinet/?for=cale#projects');assert.equal(els['#search'].focused,true);assert.equal(els['#clear-filters'].hidden,true)});
test('search accepts words in any order',()=>{els['#search'].value='kit dodgeball';els['#search'].events.input();assert.equal(visible().length,1)});
test('normalizes accents and case',()=>{els['#search'].value='CÁLE';els['#search'].events.input();assert.ok(visible().length>=2)});
test('no-results state is reversible in one click',()=>{els['#search'].value='impossible-xyz';els['#search'].events.input();assert.equal(els['#empty'].hidden,false);assert.equal(els['#clear-filters'].hidden,false);els['#clear-filters'].events.click();assert.equal(els['#empty'].hidden,true);assert.equal(visible().length,44)});
test('room and search combine',()=>{els['#search'].value='music';els['#room'].value='afterdark';els['#room'].events.change();assert.ok(visible().length>0);assert.ok(visible().every(x=>x.dataset.stage==='afterdark'))});
test('back/forward restores URL state',()=>{location.href='https://gordonusc.github.io/the-cabinet/?q=final+boss&room=stadium#projects';events.popstate();assert.equal(visible().length,1);assert.equal(els['#search'].value,'final boss')});
test('unknown room falls back to all rooms',()=>{location.href='https://gordonusc.github.io/the-cabinet/?room=not-a-room';events.pageshow();assert.equal(els['#room'].value,'all');assert.equal(visible().length,44)});
test('updated Tape Log claims and media route exist',()=>{assert.match(html,/Nine game shows, fourteen years, three wins/);assert.ok(!html.includes('Eight game shows'));assert.match(html,/media-log\/#record/);assert.ok(fs.existsSync(path.join(root,'new/final-boss.jpg')))});
console.log(`${checks} Cabinet regression checks passed. DOM adapters; no browser rendering asserted.`);
