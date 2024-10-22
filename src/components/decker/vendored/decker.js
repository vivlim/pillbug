// lil: Learning in Layers

let allocs=0,calldepth=0,do_panic=0
export const lmn  =x      =>(allocs++,{t:'num',v:isFinite(x)?+x:0}),   lin  =x=>x&&x.t=='num'
export const lms  =x      =>(allocs++,{t:'str',v:''+x }),              lis  =x=>x&&x.t=='str'
export const lml  =x      =>(allocs++,{t:'lst',v:x    }),              lil  =x=>x&&x.t=='lst'
export const lmd  =(k,v)  =>(allocs++,{t:'dic',k:k||[],v:v||[]}),      lid  =x=>x&&x.t=='dic'
export const lmt  =_      =>(allocs++,{t:'tab',v:new Map()}),          lit  =x=>x&&x.t=='tab'
export const lmi  =(f,n,x)=>(allocs++,{t:'int',f,n}),                  lii  =x=>x&&x.t=='int'
export const lmon =(n,a,b)=>(allocs++,{t:'on' ,n:n,a:a,b:b,c:null}),   lion =x=>x&&x.t=='on'
export const lmnat=f      =>(allocs++,{t:'nat',f:f}),                  linat=x=>x&&x.t=='nat'
export const lmblk=_      =>(allocs++,{t:'blk',b:[],locals:[]}),       liblk=x=>x&&x.t=='blk'
export const lmenv=p      =>{allocs++;const r={t:'env',v:new Map(),p:p};r.local=(n,x)=>env_local(r,lms(n),x);return r}

export const NONE=lmn(0), ONE=lmn(1), seed=0x12345, max=Math.max, min=Math.min, abs=Math.abs
export const ISODATE=lms('%04i-%02i-%02iT%02i:%02i:%02iZ%n%m'), PARTS=['year','month','day','hour','minute','second'].map(lms)
export const clchar=x=>{const c=x.charCodeAt(0);return x=='\t'?' ':(c>=32&&c<=126)||(x=='\n')?x:'?'}
export const clchars=x=>x.replace(/\r/g,'').replace(/\t/g,' ').replace(/[\u201C\u201D]/g,'"').replace(/[\u2018\u2019]/g,"'").replace(/[^ -~\n]/g,'?')
export const wnum=y=>{
	let w='',d='',s=y<0?(y=-y,'-'):'',i=Math.floor(y);y=Math.round((y-Math.floor(y))*1000000);if(y>=1000000)i++
	while(i>0){w=(0|i%10)+w,i=i/10}for(let z=0;z<6;z++){d=(0|y%10)+d,y=y/10}
	return s+('0'+w).replace(/^(0+)(?=[^0])/,'')+('.'+d).replace(/(\.?0+)$/,'')
}
export const mod=(x,y)=>x-y*Math.floor(x/y)
export const range=x=>Array.from(Array(x)).map((_,i)=>i)
export const tab_get=(t,c)=>t.v.get(c)
export const tab_has=(t,c)=>t.v.get(c)!=undefined
export const tab_cell=(t,c,i)=>(t.v.get(c)||[])[i]
export const tab_set=(t,c,v)=>t.v.set(c,v)
export const tab_cols=t        =>{const r=[]   ;for(let k of t.v.keys())r.push(k);return r}
export const tab_row=(t,i)     =>{const r=lmd();for(let k of t.v.keys())dset(r,lms(k),tab_cell(t,k,i));return r}
export const tab_splice=(f,x,t)=>{const r=lmt();for(let k of t.v.keys())tab_set(r,k,f(x,tab_get(t,k)));return r}
export const tab_clone=t       =>{const r=lmt();for(let k of t.v.keys())tab_set(r,k,tab_get(t,k).slice(0));return r}
export const tab_rowcount=t=>!t.v.size?0: t.v.values().next().value.length
export const torect=t=>{
	let n=0;for(let x of t.v.values())n=max(n,lil(x)?count(x):1);
	for(let k of t.v.keys()){const v=tab_get(t,k);tab_set(t,k,take(n,lil(v)?v.v:[v]))}
}
export const count=x=>lin(x)?1: lis(x)||lil(x)||lid(x)?x.v.length: lit(x)?tab_rowcount(x): 0
export const rows=x=>{const t=lt(x);return lml(range(tab_rowcount(t)).map(i=>tab_row(t,i)))}
export const coltab=x=>{
	const n=lmn(x.v.reduce((x,y)=>max(x,lil(y)?count(y):1),0)),r=lmt()
	x.k.map((k,i)=>tab_set(r,ls(k),dyad.take(n,dyad.take(n,lil(x.v[i])?x.v[i]:lml([x.v[i]]))).v));return r
}
export const rowtab=x=>{
	const ok=[],t=lmt()
	x.v.map(r=>r.k.map(k=>{if(!tab_has(t,ls(k)))ok.push(k);tab_set(t,ls(k),[])}))
	x.v.map(x=>ok.map(k=>tab_get(t,ls(k)).push(dget(x,k)||NONE)));return t
}
export const listab=x=>{
	const m=x.v.reduce((r,x)=>max(r,count(x)),0);const t=lmt();for(let z=0;z<m;z++)tab_set(t,'c'+z,[])
	x.v.map(row=>{for(let z=0;z<m;z++)tab_get(t,'c'+z).push(z>=count(row)?NONE:row.v[z])});return t
}
export const tflip=x=>{
	const c=tab_cols(x),kk=c.indexOf('key')>-1?'key':c[0],k=(tab_get(x,kk)||[]).map(ls),cc=c.filter(k=>k!=kk),r=lmt()
	tab_set(r,'key',cc.map(lms));k.map((k,i)=>tab_set(r,k,cc.map(c=>tab_cell(x,c,i))));return r
}
export const tcat=(x,y)=>{
	const r=lmt()
	tab_cols(x).map(k=>tab_set(r,k,tab_get(x,k).concat(tab_has(y,k)?[]:range(count(y)).map(x=>NONE))))
	tab_cols(y).map(k=>tab_set(r,k,(tab_has(x,k)?tab_get(x,k):range(count(x)).map(x=>NONE)).concat(tab_get(y,k))));return r
}
export const zip=(x,y,f)=>{const n=count(x),o=count(y)<n?take(n,y.v):y.v;return x.v.map((x,i)=>f(x,o[i%n]))}
export const dzip=(x,y,f)=>{
	const r=lmd(x.k.slice(0),x.v.map((z,i)=>f(z,dget(y,x.k[i])||NONE)))
	y.k.filter(k=>!dget(x,k)).map(k=>dset(r,k,f(NONE,dget(y,k))));return r
}
export const match=(x,y)=>x==y?1: (x.t!=y.t)||(count(x)!=count(y))?0: (lin(x)||lis(y))?x.v==y.v:
	         lil(x)?x.v.every((z,i)=>dyad['~'](z,y.v[i]).v): lit(x)?dyad['~'](rows(x),rows(y)).v:
	         lid(x)?x.v.every((z,i)=>dyad['~'](z,y.v[i]).v&&dyad['~'](x.k[i],y.k[i]).v):0
export const splice=(f,x,y)=>lis(y)?lms(f(x,ll(y)).map(ls).join('')): lid(y)?lmd(f(x,y.k),f(x,y.v)): lit(y)?tab_splice(f,x,y): lml(f(x,ll(y)))
export const ina=(x,y)=>lmn(lis(y)?y.v.indexOf(ls(x))>=0: lil(y)?y.v.some(y=>match(x,y)): lid(y)?dget(y,x)!=undefined: lit(y)?tab_has(y,ls(x)): x==y)
export const filter=(i,x,y)=>{
	x=lis(x)?monad.list(x):lml(ll(x))
	if(lid(y)){const r=lmd();y.k.forEach((k,v)=>i==lb(ina(k,x))&&dset(r,k,y.v[v]));return r}
	if(!lit(y))return lml(ll(y).filter(z=>i==lb(ina(z,x))))
	const n=x.v.every(lin),nx=x.v.map(ln),ix=range(tab_rowcount(y))
	if(n&& i){const r=dyad.take(NONE,y);nx.forEach(i=>{for(c of y.v.keys()){const v=tab_cell(y,c,i);if(v)tab_get(r,c).push(v)}});return r}
	if(n&&!i){const r=dyad.take(NONE,y);ix.forEach(i=>{if(nx.indexOf(i)<0){for(let c of y.v.keys())tab_get(r,c).push(tab_cell(y,c,i))}});return r}
	const r=lmt();for(let k of y.v.keys())if(i==lb(ina(lms(k),x)))tab_set(r,k,tab_get(y,k));return r
}
export const take=(x,y)=>{const n=y.length, s=x<0?mod(x,n):0; return range(abs(x)).map(z=>y[mod(z+s,n)]||NONE)}
export const dkix=(dict,key)=>dict.k.findIndex(x=>match(key,x)), dget=(dict,key)=>dict.v[dkix(dict,key)]
export const dvix=(dict,val)=>dict.v.findIndex(x=>match(val,x)), dkey=(dict,val)=>dict.k[dvix(dict,val)]
export const dset=(d,k,v)=>{const i=d.k.findIndex(x=>match(x,k));if(i<0){d.k.push(k),d.v.push(v)}else{d.v[i]=v};return d}
export const union=(x,y)=>{const r=lmd(x.k.slice(0),x.v.slice(0));y.k.forEach(k=>dset(r,k,dget(y,k)));return r}
export const amend=(x,i,y)=>{
	if(lii(x))return x.f(x,i,y)
	if(lit(x)&&lin(i)){
		const r=tab_clone(x), rn=count(x), cols=ll(monad.keys(x)), ri=0|ln(i); y=lid(y)?y: lmd(cols, new Array(cols.length).fill(y))
		if(ri>=0&&ri<rn)y.k.map((k,i)=>{k=ls(k);if(tab_has(r,k))tab_get(r,k)[ri]=y.v[i]});return r
	}
	if(lit(x)&&lis(i)){
		const r=tab_clone(x), rn=count(x), c=lil(y)?ll(y).slice(0,rn): new Array(rn).fill(y)
		while(c.length<rn)c.push(NONE);tab_set(r,ls(i),c);return r
	}
	if(!lis(x)&&!lil(x)&&!lid(x))return amend(lml([]),i,y)
	if((lil(x)||lis(x))&&(!lin(i)||(ln(i)<0||ln(i)>count(x))))return amend(ld(x),i,y)
	if(lil(x)){const r=lml(x.v.slice(0));r.v[ln(i)|0]=y;return r}
	return lid(x)?dset(lmd(x.k.slice(0),x.v.slice(0)),i,y): lis(x)?lms(ls(x).slice(0,ln(i))+ls(y)+ls(x).slice(1+ln(i))): lml([])
}
export const l_at=(x,y)=>{
	if(lii(x))return lis(y)&&y.v=='type'?lms(x.n): x.f(x,y)
	if(lit(x)&&lin(y))x=monad.rows(x); if((lis(x)||lil(x))&&!lin(y))x=ld(x)
	return lis(x)?lms(x.v[ln(y)|0]||''): lil(x)?x.v[ln(y)|0]||NONE: lid(x)?dget(x,y)||NONE: lit(x)&&lis(y)?lml(tab_get(x,ls(y))): NONE
}
export const amendv=(x,i,y,n,tla)=>{
	if(lii(x))tla.v=0;const f=monad.first(i[n]||NONE)
	return (!tla.v&&n+1 <i.length)?amendv(l_at(x,f),i,y,n+1,tla):
	       (n+1<i.length)?amend(x,f,amendv(l_at(x,f),i,y,n+1,tla)): (n+1==i.length)?amend(x,f,y): y
}
export const lb=x=>lin(x)?x.v!=0: lis(x)?x.v!='': lil(x)||lid(x)?x.v.length: 1
export const ln=x=>lin(x)?x.v: lis(x)?(isFinite(x.v)?+x.v:0): lil(x)||lid(x)?ln(x.v[0]): 0
export const ls=x=>lin(x)?wnum(x.v): lis(x)?x.v: lil(x)?x.v.map(ls).join(''): ''
export const ll=x=>lis(x)?x.v.split('').map(lms): lil(x)||lid(x)?x.v: lit(x)?rows(x).v: [x]
export const ld=x=>lid(x)?x:lit(x)?monad.cols(x):lil(x)||lis(x)?lmd(range(count(x)).map(lmn),lis(x)?ll(x):x.v):lmd()
export const lt=x=>{if(lit(x))return x;const r=lmt();if(lid(x)){tab_set(r,'key',x.k.slice(0))};tab_set(r,'value',ll(x));return r}
export const vm=f=>{const r=x=>lid(x)?lmd(x.k,x.v.map(r)):lil(x)?lml(x.v.map(r)):f(x);return r}
export const vd=f=>{const r=(x,y)=>
	 lid(x)&lid(y)?dzip(x,y,r)    :lid(x)&!lid(y)?lmd(x.k.slice(0),x.v.map(x=>r(x,y))):!lid(x)&lid(y)?lmd(y.k.slice(0),y.v.map(y=>r(x,y))):
	 lil(x)&lil(y)?lml(zip(x,y,r)):lil(x)&!lil(y)?lml(x.v.map(x=>r(x,y)))             :!lil(x)&lil(y)?lml(y.v.map(y=>r(x,y))): f(x,y);return r}
export const vmnl=f=>{const r=x=>lil(x)?(ll(x).some(x=>!lin(x))?lml(x.v.map(r)):f(x)):f(x);return r}
export const fstr=x=>{
	let ct=0;return x.split('').map(x=>{
		let e=0;if(x=='<'){ct=1}else if(x=='/'&&ct){e=1}else if(x!=' '&&x!='\n'){ct=0}
		return e?'\\/':({'\n':'\\n','\\':'\\\\','"':'\\"'})[x]||x
	}).join('')
}
export const fjson=x=>lin(x)?wnum(x.v): lit(x)?fjson(rows(x)): lil(x)?`[${x.v.map(fjson).join(',')}]`:
         lis(x)?`"${fstr(x.v)}"`:lid(x)?`{${x.k.map((k,i)=>`${fjson(lms(ls(k)))}:${fjson(x.v[i])}`).join(',')}}`:'null'
export const flove=x=>lin(x)||lis(x)?fjson(x): lil(x)?`[${x.v.map(flove).join(',')}]`:
         lid(x)?`{${x.k.map((k,i)=>`${flove(k)}:${flove(x.v[i])}`).join(',')}}`:
         lit(x)?`<${tab_cols(x).map(k=>`${flove(lms(k))}:${flove(lml(tab_get(x,k)))}`).join(',')}>`:
         lii(x)?ls(ifield(x,'encoded')): 'null'
export const pjson=(y,h,n)=>{
	const si=h, hn=_=>m&&y[h]&&(n?h-si<n:1), hnn=x=>m&&h+x<=y.length&&(n?h+x-si<n:1)
	const jd=_=>{while(hn()&&/[0-9]/.test(y[h]))h++}, jm=x=>hn()&&y[h]==x?(h++,1):0, iw=_=>/[ \n]/.test(y[h]), ws=_=>{while(hn()&&iw())h++}
	const esc=e=>e=='n'?'\n': /[\\/"']/.test(e)?e: e=='u'&&hnn(4)?String.fromCharCode(parseInt(y.slice(h,h+=4),16)):' '
	let f=1, m=1, rec=_=>{
		const t={null:NONE,false:NONE,true:ONE};for(let k in t)if(hnn(k.length)&&y.slice(h,h+k.length)==k)return h+=k.length,t[k]
		if(jm('[')){const r=lml([]);while(f&&hn()){ws();if(jm(']'))break;r.v.push(rec()),ws(),jm(',')}return r}
		if(jm('{')){const r=lmd();while(f&&hn()){ws();if(jm('}'))break;const k=rec();ws(),jm(':'),ws();if(f)dset(r,k,rec());ws(),jm(',')}return r}
		if(jm('"')){let r='';while(f&&hn()&&!jm('"'))r+=hnn(2)&&jm('\\')?esc(y[h++]):y[h++];return lms(r)}
		if(jm("'")){let r='';while(f&&hn()&&!jm("'"))r+=hnn(2)&&jm('\\')?esc(y[h++]):y[h++];return lms(r)}
		const ns=h;jm('-'),jd(),jm('.'),jd();if(jm('e')||jm('E')){jm('-')||jm('+');jd();}return h<=ns?(f=0,NONE): lmn(+y.slice(ns,h))
	}, r=rec();return {value:r,index:h}
}
export const idecode=x=>{
	const p=x.slice(0,5).toLowerCase()
	return p=='%%img'?image_read(x): p=='%%snd'?sound_read(x): p=='%%dat'?array_read(x): NONE
}
export const plove=(y,h,n)=>{
	const si=h, hn=_=>m&&y[h]&&(n?h-si<n:1), hnn=x=>m&&h+x<=y.length&&(n?h+x-si<n:1)
	const jd=_=>{while(hn()&&/[0-9]/.test(y[h]))h++}, jm=x=>hn()&&y[h]==x?(h++,1):0, iw=_=>/[ \n]/.test(y[h]), ws=_=>{while(hn()&&iw())h++}
	const esc=e=>e=='n'?'\n': /[\\/"']/.test(e)?e: e=='u'&&hnn(4)?String.fromCharCode(parseInt(y.slice(h,h+=4),16)):' '
	let f=1, m=1, rec=_=>{
		const t={null:NONE,false:NONE,true:ONE};for(let k in t)if(hnn(k.length)&&y.slice(h,h+k.length)==k)return h+=k.length,t[k]
		if(jm('[')){const r=lml([]);while(f&&hn()){ws();if(jm(']'))break;r.v.push(rec()),ws(),jm(',')}return r}
		if(jm('{')){const r=lmd();while(f&&hn()){ws();if(jm('}'))break;const k=rec();ws(),jm(':'),ws();if(f)dset(r,       k,         rec()  );ws(),jm(',')}return r}
		if(jm('<')){const r=lmd();while(f&&hn()){ws();if(jm('>'))break;const k=rec();ws(),jm(':'),ws();if(f)dset(r,lms(ls(k)),lml(ll(rec())));ws(),jm(',')}return monad.table(r)}
		if(jm('%')){jm('%');let r='%%';while(f&&hn()&&/[a-zA-Z0-9+/=]/.test(y[h]))r+=y[h++];return idecode(r)}
		if(jm('"')){let r='';while(f&&hn()&&!jm('"'))r+=hnn(2)&&jm('\\')?esc(y[h++]):y[h++];return lms(r)}
		if(jm("'")){let r='';while(f&&hn()&&!jm("'"))r+=hnn(2)&&jm('\\')?esc(y[h++]):y[h++];return lms(r)}
		const ns=h;jm('-'),jd(),jm('.'),jd();if(jm('e')||jm('E')){jm('-')||jm('+');jd();}return h<=ns?(f=0,NONE): lmn(+y.slice(ns,h))
	}, r=rec();return {value:r,index:h}
}
export const format_has_names=x=>{
	let f=0;while(x[f]){
		if(x[f]!='%'){f++;continue;}f++;if(x[f]=='[')return 1
		if(x[f]=='*')f++;if(x[f]=='-')f++;if(x[f]=='0')f++;while(/[0-9]/.test(x[f]))f++;if(x[f]=='.')f++
		let d=0;while(/[0-9]/.test(x[f]))d=d*10+(+x[f++]);if(!x[f])break;const t=x[f++];if(t=='r'||t=='o')while(d&&x[f])d--,f++
	}return 0
}
export const razetab=x=>{const k=tab_cols(x);return dyad.dict(lml(tab_get(x,k[0])||[]),lml(tab_get(x,k[1])||[]))}
export const monad={
	'-':    vm(x=>lmn(-ln(x))),
	'!':    vm(x=>lb(x)?NONE:ONE),
	floor:  vm(x=>lmn(Math.floor(ln(x)))),
	cos:    vm(x=>lmn(Math.cos(ln(x)))),
	sin:    vm(x=>lmn(Math.sin(ln(x)))),
	tan:    vm(x=>lmn(Math.tan(ln(x)))),
	exp:    vm(x=>lmn(Math.exp(ln(x)))),
	ln:     vm(x=>lmn(Math.log(ln(x)))),
	sqrt:   vm(x=>lmn(Math.sqrt(ln(x)))),
	unit:   vm(x=>{const n=ln(x);return lml([lmn(Math.cos(n)),lmn(Math.sin(n))])}),
	mag:    vmnl(x=>lmn(Math.sqrt(ll(x).reduce((x,y)=>x+Math.pow(ln(y),2),0)))),
	heading:vmnl(x=>{const a=getpair(x);return lmn(Math.atan2(a.y,a.x))}),
	sum:    x=>ll(x).reduce(dyad['+'],NONE),
	prod:   x=>ll(x).reduce(dyad['*'],ONE),
	raze:   x=>lit(x)?razetab(x) :ll(x).slice(1).reduce(dyad[','],monad.first(x)),
	max:    x=>ll(x).slice(1).reduce(dyad['|'],monad.first(x)),
	min:    x=>ll(x).slice(1).reduce(dyad['&'],monad.first(x)),
	count:  x=>lmn(count(x)),
	first:  x=>lis(x)?lms(x.v[0]||''):            lit(x)?monad.first(rows(x)): lion(x)?lms(x.n): linat(x)?lms('native'): count(x)?ll(x)[0]: NONE,
	last:   x=>lis(x)?lms(x.v[x.v.length-1]||''): lit(x)?monad.last (rows(x)): count(x)?ll(x)[count(x)-1]: NONE,
	keys:   x=>lml(lii(x)?[]: lion(x)?x.a.map(lms): ld(x).k),
	range:  x=>lml(lin(x)?range(max(0,0|ln(x))).map(lmn): ld(x).v),
	list:   x=>lml([x]),
	typeof: x=>lms(({num:"number",str:"string",lst:"list",dic:"dict",tab:"table",on:"function",nat:"function"})[x.t]||x.n||"interface"),
	flip:   x=>lit(x)?tflip(x):lml(range(ll(x).reduce((w,z)=>max(w,lil(z)?count(z):1),0)).map(i=>lml(ll(x).map(c=> !lil(c)?c: i<count(c)?c.v[i]: NONE)))),
	rows:   x=>rows(x),
	cols:   x=>{const t=lt(x),k=tab_cols(t);return lmd(k.map(lms),k.map(x=>lml(tab_get(t,x))))},
	table:  x=>lid(x)?coltab(x): lil(x)&&x.v.every(lid)?rowtab(x): lil(x)&&x.v.every(lil)?listab(x): lt(x),
	'@tab': t=>{
		t=lt(t);const r=tab_clone(t)
		tab_set(r,'index' ,range(count(r)).map(lmn))
		tab_set(r,'gindex',range(count(r)).map(lmn))
		tab_set(r,'group' ,range(count(r)).map(x=>NONE))
		return r
	},
}
export const dyad={
	'+':  vd((x,y)=>lmn(ln(x)+ln(y))),
	'-':  vd((x,y)=>lmn(ln(x)-ln(y))),
	'*':  vd((x,y)=>lmn(ln(x)*ln(y))),
	'/':  vd((x,y)=>lmn(ln(x)/ln(y))),
	'%':  vd((x,y)=>lmn(mod(ln(y),ln(x)))),
	'^':  vd((x,y)=>lmn(Math.pow(ln(x),ln(y)))),
	'<':  vd((x,y)=>lmn(lin(x)&&lin(y)?ln(x)< ln(y): ls(x)< ls(y))),
	'>':  vd((x,y)=>lmn(lin(x)&&lin(y)?ln(x)> ln(y): ls(x)> ls(y))),
	'=':  vd((x,y)=>lmn(lii(x)||lii(y)?x==y: lin(x)&&lin(y)?ln(x)==ln(y): ls(x)==ls(y))),
	'&':  vd((x,y)=>lin(x)||lin(y)?lmn(min(ln(x),ln(y))): lms(ls(x)<ls(y)?ls(x):ls(y))),
	'|':  vd((x,y)=>lin(x)||lin(y)?lmn(max(ln(x),ln(y))): lms(ls(x)>ls(y)?ls(x):ls(y))),
	split:(x,y)=>lml(ls(y).split(ls(x)).map(lms)),
	fuse: (x,y)=>lms(ll(y).map(ls).join(ls(x))),
	dict: (x,y)=>(y=ll(y),ll(x).reduce((d,x,i)=>dset(d,x,y[i]||NONE),lmd())),
	take: (x,y)=>lis(y)&&lin(x)&&ln(x)<0&&abs(ln(x))<=count(y)?lms(y.v.slice(count(y)+ln(x))):
                 lis(y)&&lin(x)&&ln(x)>=0&&ln(x)<=count(y)?lms(y.v.slice(0,ln(x))):
	             lin(x)?splice(take,ln(x),y):filter(1,x,y),
	drop: (x,y)=>lis(y)&&lin(x)&&ln(x)>=0?lms(y.v.slice(ln(x))):
                 lis(y)&&lin(x)&&ln(x)<0 ?lms(y.v.slice(0,max(0,count(y)+ln(x)))):
	             lin(x)?splice((x,y)=>x<0?y.slice(0,x):y.slice(x),ln(x),y):filter(0,x,y),
	limit:(x,y)=>count(y)>ln(x)?dyad.take(lmn(ln(x)),y):y,
	in:   (x,y)=>lil(x)?lml(x.v.map(x=>dyad.in(x,y))):ina(x,y),
	',':  (x,y)=>lit(x)&&lit(y)?tcat(x,y): lid(x)?union(x,ld(y)):
                 lis(x)?dyad[','](lml([x]),y): lis(y)?dyad[','](x,lml([y])): lml(ll(x).concat(ll(y))),
	'~':  (x,y)=>match(x,y)?ONE:NONE,
	unless:(x,y)=>lin(y)&&ln(y)==0?x:y,
	join: (x,y)=>{ // natural join on tables.
		const f=x=>lin(x)?monad.range(x):lml(ll(x));if(!lit(x)||!lit(y))return lml(zip(f(x),f(y),dyad[',']))
		const a=x,b=y,ak=tab_cols(a),bk=tab_cols(b), ik=bk.filter(x=>ak.indexOf(x)>=0),dk=bk.filter(x=>ak.indexOf(x)<0)
		const r=lmt(); ak.forEach(k=>tab_set(r,k,[])), dk.forEach(k=>tab_set(r,k,[]))
		for(let ai=0;ai<count(a);ai++)for(let bi=0;bi<count(b);bi++)if(ik.every(k=>match(tab_cell(a,k,ai),tab_cell(b,k,bi))))
			ak.forEach(k=>tab_get(r,k).push(tab_cell(a,k,ai))),dk.forEach(k=>tab_get(r,k).push(tab_cell(b,k,bi)))
		return r
	},
	cross: (x,y)=>{ // cartesian join; force columns to be unique:
		const f=x=>lt(lin(x)?monad.range(x):lml(ll(x)));if(!lit(x)||!lit(y))return lml(rows(dyad.cross(f(x),f(y))).v.map(x=>lml(x.v)))
		const a=lt(x),b=lt(y), ak=tab_cols(a),bk=tab_cols(b), uk=bk.map(x=>ak.indexOf(x)>=0?x+'_':x)
		const r=lmt(); ak.forEach(k=>tab_set(r,k,[])), uk.forEach(k=>tab_set(r,k,[]))
		for(let bi=0;bi<count(b);bi++)for(let ai=0;ai<count(a);ai++){
			ak.forEach(k=>tab_get(r,k).push(tab_cell(a,k,ai)))
			bk.forEach((k,i)=>tab_get(r,uk[i]).push(tab_cell(b,k,bi)))
		}return r
	},
	parse: (x,y)=>{
		if(lil(y))return lml(y.v.map(y=>dyad.parse(x,y)))
		x=ls(x),y=ls(y);let f=0,h=0,m=1,pi=0,named=format_has_names(x),r=named?lmd():lml([]);while(x[f]){
			if(x[f]!='%'){if(m&&x[f]==y[h]){h++}else{m=0}f++;continue}f++
			let nk=null;if(x[f]=='['){f++;nk='';while(x[f]&&x[f]!=']')nk+=x[f++];if(x[f]==']')f++}
			let n=0,d=0,v=null,si=h,sk=x[f]=='*'&&(f++,1),lf=x[f]=='-'&&(f++,1);if(x[f]=='0')f++
			const hn=_=>m&&y[h]&&(n?h-si<n:1), id=x=>/[0-9]/.test(x), ix=_=>/[0-9a-fA-F]/.test(y[h]), iw=_=>/[ \n]/.test(y[h])
			while(id(x[f]))n=n*10+(+x[f++]);x[f]=='.'&&f++
			while(id(x[f]))d=d*10+(+x[f++]);if(!x[f])break;const t=x[f++]
			if('%mnzsluqarojJ'.indexOf(t)<0)while(hn()&&iw())h++
			if(t=='%'){if(m&&t==y[h]){h++}else{m=0}}
			else if(t=='m'){v=m?ONE:NONE}
			else if(t=='n'){v=lmn(h)}
			else if(t=='z'){v=m&&h==y.length?ONE:NONE}
			else if(t=='s'||t=='l'||t=='u'){v=lms('');while(hn()&&(n?1:y[h]!=x[f]))v.v+=y[h++];if(t=='l')v.v=v.v.toLowerCase();if(t=='u')v.v=v.v.toUpperCase()}
			else if(t=='a'){v=lml([]);while(hn()&&(n?1:y[h]!=x[f]))v.v.push(lmn(y[h++].charCodeAt(0)))}
			else if(t=='b'){v=/[tTyYx1]/.test(y[h])?ONE:NONE;while(hn()&&(n?1:y[h]!=x[f]))h++}
			else if(t=='i'){v=lmn(0);const s=(y[h]=='-')?(h++,-1):1;m&=id(y[h]);while(hn()&&id(y[h]))v.v=v.v*10+(+y[h++]);v.v*=s}
			else if(t=='h'||t=='H'){v=lmn(0),                       m&=ix();    while(hn()&&ix())v.v=v.v*16+parseInt(y[h++],16)}
			else if(t=='j'){if(m){const j=pjson(y,h,n);h=j.index,v=j.value}else{v=NONE}}
			else if(t=='J'){if(m){const j=plove(y,h,n);h=j.index,v=j.value}else{v=NONE}}
			else if(t=='v'){v=lms(''),m&=!id(y[h]);while(hn()&&/[0-9a-zA-Z_?]/.test(y[h]))v.v+=y[h++];m&=count(v)>0}
			else if(t=='q'){
				v=lms(''),m&=y[h]=='"';if(m)h++;while(hn()&&y[h]!='"'){
					if(y[h]=='\\'){h++;if(/[n\\"]/.test(y[h])){v.v+=y[h]=='n'?'\n':y[h]}else{m=0}}else{v.v+=y[h]}h++
				}if(m&=y[h]=='"')h++
			}
			else if(t=='f'||t=='c'||t=='C'){
				v=lmn(0);let p=10,s=(y[h]=='-')?(h++,-1):1; if(t=='c'&&m&&y[h]=='$')h++
				m&=id(y[h])||y[h]=='.';  while(hn()&&id(y[h]))v.v=v.v*10+(+y[h++])
				m&&hn()&&y[h]=='.'&&h++; while(hn()&&id(y[h]))v.v+=(+y[h++])/p,p*=10;v.v*=s
			}
			else if(t=='r'||t=='o'){
				let cc=x.slice(f,f+(d||1));v=lms(''),f+=(d||1);
				while(hn()){if(cc.indexOf(y[h])>=0==lf?1:0){if(n)m=0;break}v.v+=y[h++];if(t=='o')break;}if(!m)v.v='';
			}
			else if(t=='e'||t=='p'){
				const [dy,dm,dd,dh,dmi,ds,dl,dma]=ll(dyad.parse(ISODATE,lms(y.slice(h)))), l=ln(dl), d=new Date(y.slice(h,h+l))
				if(l&&ln(dma)){h+=l}else{m=0}; v=t=='e'?lmn(m?0|(d.getTime()/1000):0):lmd(PARTS,[dy,dm,dd,dh,dmi,ds])
			}else{m=0}while(n&&y[h]&&h-si<n)h++,m=0;if(!sk&&v!=null){named?dset(r,nk!=null?lms(nk):lmn(pi),v):r.v.push(v);pi++}
		}return named?r: r.v.length==1?r.v[0]:r
	},
	format: (x,y)=>{
		const frec=(i,x,y)=>{
			if(i>=count(x))return y
			const fuse=(count(x)-i)%2?0:1,named=format_has_names(ls(x.v[i+fuse]))
			const r=lml(ll(lit(y)?rows(y):y).map(z=>dyad.format(x.v[i+fuse],frec(i+fuse+1,x,lit(y)&&!named?lml(ll(z)):z))))
			return fuse?dyad.fuse(x.v[i],r):r
		};if(lil(x))return frec(0,x,y)
		x=ls(x);let r='',f=0,h=0,named=format_has_names(x);y=named?ld(y):lil(y)?y:monad.list(y);while(x[f]){
			if(x[f]!='%'){r+=x[f++];continue}f++
			let nk=null;if(x[f]=='['){f++;nk='';while(x[f]&&x[f]!=']')nk+=x[f++];if(x[f]==']')f++}
			let n=0,d=0,sk=x[f]=='*'&&(f++,1),lf=x[f]=='-'&&(f++,1),pz=x[f]=='0'&&(f++,1)
			const hn=_=>m&&y[h]&&(n?h-si<n:1), id=x=>/[0-9]/.test(x)
			while(id(x[f]))n=n*10+(+x[f++]);x[f]=='.'&&f++
			while(id(x[f]))d=d*10+(+x[f++]);if(!x[f])break;const t=x[f++]
			let o='', a='sluvroq'.indexOf(t)>=0?lms(''):NONE, an=named?dget(y,nk!=null?lms(nk):lmn(h)):null
			a=t=='%'?NONE: named?(an?an:a): (!sk&&h<count(y))?y.v[h]:a;if(t!='%'&&!sk)h++
			if     (t=='%'){o='%'}
			else if(t=='s'||t=='v'){o=ls(a)}
			else if(t=='l'){o=ls(a).toLowerCase()}
			else if(t=='u'){o=ls(a).toUpperCase()}
			else if(t=='r'||t=='o'){o=ls(a),lf=1;d=max(1,d);while(d&&x[f])d--,f++;d=n;}
			else if(t=='a'){o=ll(a).map(x=>clchar(String.fromCharCode(ln(x)))).join('')}
			else if(t=='b'){o=lb(a)?'true':'false'}
			else if(t=='f'){o=d?ln(a).toFixed(min(100,d)):wnum(ln(a))}
			else if(t=='c'){const v=ln(a);o=(v<0?'-':'')+'$'+abs(v).toFixed(min(100,d)||2)}
			else if(t=='C'){const v=ln(a);o=(v<0?'-':'')    +abs(v).toFixed(min(100,d)||2)}
			else if(t=='i'){o=''+Math.trunc(ln(a))}
			else if(t=='h'||t=='H'){o=ln(a).toString(16);if(t=='H')o=o.toUpperCase()}
			else if(t=='e'){o=new Date(ln(a)*1000).toISOString().split('.')[0]+'Z'}
			else if(t=='p'){const d=ld(a);o=dyad.format(ISODATE,lml(PARTS.map(x=>dget(d,x)))).v}
			else if(t=='j'){o=fjson(a)}
			else if(t=='J'){o=flove(a)}
			else if(t=='q'){o=fjson(lms(ls(a)))}
			let vn=o.length; if(d&&(t=='f'||t=='c'||t=='C'))d=0;if(d&&lf)vn=min(d,vn)
			if(n&&!lf)for(let z=0;z<n-vn;z++)r+=pz?'0':' '
			for(let z=d&&!lf?max(0,vn-d):0;z<vn;z++)r+=o[z]
			if(n&&lf)for(let z=0;z<n-vn;z++)r+=pz?'0':' '
		}return lms(r)
	},
	like: (x,y)=>{
		if(!lil(y))y=monad.list(y);const pats=y.v.map(pat=>{
			const r={m:'',l:'',a:[]},ch=ls(pat).split('');for(let i=0;i<ch.length;i++){
				r.m+=ch[i]=='`'&&i<ch.length-1?(r.l+=ch[++i],'a'): ch[i]in{'.':1,'*':1,'#':1}?(r.l+='!',ch[i]): (r.l+=ch[i],'a')
				while(ch[i]=='*'&&ch[i+1]=='*')i++
			}return r
		})
		const test=str=>{
			for(let pi=0;pi<pats.length;pi++){
				const m=pats[pi].m, l=pats[pi].l, sc=m.length, a=new Uint8Array(sc);a[0]=m[0]=='*'
				if(!sc&&!str.length){return ONE}else if(!sc)continue;for(let ci=0;ci<str.length;ci++){
					const c=str[ci];for(let si=sc-1;si>=0;si--){
						const prev=(si>0&&a[si-1])||(si==0&&ci==0)||(si>1&&m[si-1]=='*'&&a[si-2])
						a[si]=m[si]=='*'?a[si]||prev: m[si]=='.'?prev: m[si]=='#'?/[0-9]/.test(c)&&prev: c==l[si]&&prev
					}
				}if(a[sc-1]||(sc>1&&m[sc-1]=='*'&&a[sc-2]))return ONE
			}return NONE
		};return lil(x)?lml(x.v.map(x=>test(ls(x)))): test(ls(x))
	},
	window: (x,y)=>{
		let n=ln(x), r=[], con;if(lis(y)){y=ls(y),con=lms}else{y=ll(y),con=lml}
		if(n>0){     for(let z=0;z    <y.length;z+=n)r.push(con(y.slice(z,z+n)))}
		if(n<0){n=-n;for(let z=0;z+n-1<y.length;z++ )r.push(con(y.slice(z,z+n)))}
		return lml(r)
	},
	'@where': (col,tab)=>{
		const w=dyad.take(lmn(count(tab)),lml(ll(col)))
		const p=lml(range(count(tab)).filter(i=>lb(w.v[i])).map(lmn))
		const r=dyad.take(p,tab);tab_set(r,'gindex',range(count(r)).map(lmn));return r
	},
	'@by': (col,tab)=>{
		const b=dyad.take(lmn(count(tab)),lml(ll(col))), r=monad.rows(tab), u=b.v.reduce((x,y)=>{dset(x,y,y);return x},lmd([],[]))
		const rows=u.v.map((v,group)=>{
			const p=lml(range(count(tab)).filter(x=>match(v,b.v[x])).map(lmn))
			const s=dyad.take(p,tab);tab_set(s,'gindex',range(count(s)).map(lmn)),tab_set(s,'group',range(count(s)).map(_=>lmn(group)));return s
		});return lml(rows)
	},
}
export const merge=(vals,keys,widen)=>{
	const i=lms('@index');let ix=null
	if(!widen){ix=lml([]);vals.v.map((val,z)=>{dget(val,i).v.map(x=>ix.v.push(x))})}
	if(widen)vals.v=vals.v.filter(x=>count(dget(x,i)))
	if(count(vals)==0)vals.v.push(keys.v.reduce((x,y)=>dset(x,y,lml([])),lmd()))
	let r=monad.raze(lml(vals.v.map(x=>monad.table(widen?x:dyad.drop(i,x)))))
	if(widen){ix=lml(tab_get(r,'@index')),r=dyad.drop(i,r)}
	return {r,ix}
}
export const n_uplevel=([a])=>{let i=2, e=getev(), r=null, name=ls(a); while(e&&i){r=e.v.get(name);if(r)i--;e=e.p};return r||NONE}
export const n_eval=([x,y,extend])=>{
	y=y?ld(y):lmd();const yy=lmd(y.k.slice(0),y.v.slice(0)), r=lmd(['value','vars'].map(lms),[NONE,yy])
	const feval=([r,x])=>{
		dset(r,lms('value'),x);const b=dget(r,lms('vars')), v=getev().v;
		for(let k of v.keys()){dset(b,lms(k),v.get(k))};return r
	}
	try{
		const prog=parse(x?ls(x):'')
		blk_opa(prog,op.BUND,2),blk_lit(prog,lmnat(feval)),blk_op(prog,op.SWAP),blk_op(prog,op.CALL)
		issue(env_bind(extend&&lb(extend)?getev():null,yy.k.map(ls),lml(yy.v)),prog)
	}catch(e){dset(r,lms('error'),lms(e.x)),dset(r,lms('errorpos'),lml([lmn(e.r),lmn(e.c)]))};return r
}
export const triad={
	'@orderby': (col,tab,order_dir)=>{
		const lex_list=(x,y,a,ix)=>{
			if(x.length<ix&&y.length<ix)return 0;const xv=x[ix]||NONE,yv=y[ix]||NONE
			return lex_less(xv,yv)?a: lex_more(xv,yv)?!a: lex_list(x,y,a,ix+1)
		}
		const lex_less=(a,b)=>lil(a)&&lil(b)? lex_list(a.v,b.v,1,0): lb(dyad['<'](a,b))
		const lex_more=(a,b)=>lil(a)&&lil(b)? lex_list(a.v,b.v,0,0): lb(dyad['>'](a,b))
		const o=dyad.take(lmn(count(tab)),lml(ll(col)));order_dir=ln(order_dir)
		const pv=range(count(tab)).sort((a,b)=>{
			if(lex_less(o.v[a],o.v[b]))return  order_dir
			if(lex_more(o.v[a],o.v[b]))return -order_dir
			return a-b // produce a stable sort
		})
		const rt=dyad.take(lml(pv.map(lmn)),tab)
		tab_set(rt,'gindex',range(count(tab)).map(lmn));return rt
	},
	'@sel': (orig,vals,keys)=>{
		const mv=merge(vals,keys,0);return count(keys)>1?mv.r: dyad.take(mv.ix,dyad.drop(lml(['index','gindex','group'].map(lms)),orig))
	},
	'@ext': (orig,vals,keys)=>{
		const r=monad.cols(triad['@sel'](orig,vals,keys))
		return count(keys)==1?(count(r)?monad.first(r):lml([])): count(r)!=1||count(r.k[0])?r: monad.first(r)
	},
	'@upd': (orig,vals,keys)=>{
		orig=dyad.drop(lml(['index','gindex','group'].map(lms)),orig);const mv=merge(vals,keys,1),r=mv.r,ix=mv.ix
		tab_cols(r).map(c=>{
			if(tab_get(r,c)==ix)return;const ci=tab_has(orig,c),col=range(count(orig)).map(z=>ci?tab_cell(orig,c,z):NONE)
			tab_set(orig,c,col),ix.v.map((x,row)=>col[0|ln(x)]=tab_cell(r,c,row))
		});return orig
	},
	'@ins': (v,n,x)=>{
		const nc=count(n), rc=Math.ceil(count(v)/nc), r=monad.table(lmd(n.v,n.v.map((_,z)=>lml(range(rc).map(r=>v.v[nc*r+z]||NONE)))))
		return lin(x)?r:dyad[','](lt(x),r)
	},
}

export const findop=(n,prims)=>Object.keys(prims).indexOf(n), as_enum=x=>x.split(',').reduce((x,y,i)=>{x[y]=i;return x},{})
let tnames=0;export const tempname=_=>lms(`@t${tnames++}`)
export const op=as_enum('JUMP,JUMPF,LIT,DUP,DROP,SWAP,OVER,BUND,OP1,OP2,OP3,GET,SET,LOC,AMEND,TAIL,CALL,BIND,ITER,EACH,NEXT,COL,IPRE,IPOST,FIDX,FMAP')
export const oplens=   [ 3   ,3    ,3  ,1  ,1   ,1   ,1   ,3   ,3  ,3  ,3  ,3  ,3  ,3  ,3    ,1   ,1   ,1   ,1   ,3   ,3   ,1  ,3   ,3    ,3   ,3    ]
export const blk_addb=(x,n  )=>x.b.push(0xFF&n)
export const blk_here=(x    )=>x.b.length
export const blk_setb=(x,i,n)=>x.b[i]=0xFF&n
export const blk_getb=(x,i  )=>0xFF&x.b[i]
export const blk_adds=(x,n  )=>{blk_addb(x,n>>8),blk_addb(x,n)}
export const blk_sets=(x,i,n)=>{blk_setb(x,i,n>>8),blk_setb(x,i+1,n)}
export const blk_gets=(x,i  )=>0xFFFF&(blk_getb(x,i)<<8|blk_getb(x,i+1))
export const blk_op  =(x,o  )=>{blk_addb(x,o);if(o==op.COL)blk_addb(x,op.SWAP)}
export const blk_opa =(x,o,i)=>{blk_addb(x,o),blk_adds(x,i);return blk_here(x)-2}
export const blk_imm =(x,o,k)=>{let i=x.locals.findIndex(x=>match(x,k));if(i==-1)i=x.locals.length,x.locals.push(k);blk_opa(x,o,i)}
export const blk_op1 =(x,n)=>blk_opa(x,op.OP1,findop(n,monad))
export const blk_op2 =(x,n)=>blk_opa(x,op.OP2,findop(n,dyad ))
export const blk_op3 =(x,n)=>blk_opa(x,op.OP3,findop(n,triad))
export const blk_lit =(x,v)=>blk_imm(x,op.LIT,v)
export const blk_set =(x,n)=>blk_imm(x,op.SET,n)
export const blk_loc =(x,n)=>blk_imm(x,op.LOC,n)
export const blk_get =(x,n)=>blk_imm(x,op.GET,n)
export const blk_getimm=(x,i)=>x.locals[i]
export const blk_cat=(x,y)=>{
	let z=0,base=blk_here(x);while(z<blk_here(y)){
		const b=blk_getb(y,z);if(b==op.LIT||b==op.GET||b==op.SET||b==op.LOC||b==op.AMEND){blk_imm(x,b,blk_getimm(y,blk_gets(y,z+1)))}
		else if(b==op.JUMP||b==op.JUMPF||b==op.EACH||b==op.NEXT||b==op.FIDX){blk_opa(x,b,blk_gets(y,z+1)+base)}
		else{for(let i=0;i<oplens[b];i++)blk_addb(x,blk_getb(y,z+i))}z+=oplens[b]
	}
}
export const blk_loop=(b,names,f)=>{
	blk_op(b,op.ITER);const head=blk_here(b);blk_lit(b,names);const each=blk_opa(b,op.EACH,0)
	f(),blk_opa(b,op.NEXT,head),blk_sets(b,each,blk_here(b))
}
export const blk_end=x=>{
	let z=0;while(z<blk_here(x)){
		let b=blk_getb(x,z);z+=oplens[b];if(b!=op.CALL)continue
		let t=1,i=z;while(i<blk_here(x)){if(blk_getb(x,i)!=op.JUMP){t=0;break}const a=blk_gets(x,i+1);if(a<=i){t=0;break}i=a}if(t)blk_setb(x,z-1,op.TAIL)
	}return x
}

export const parse=text=>{
	let i=0,r=0,c=0, tq=null // text index, row, column, token queued
	const er=x=>{throw {x,r,c,i,stack:new Error().stack}}
	const nc=_=>{const x=text[i++];x=='\n'?(r++,c=0):(c++);return x}
	const iw=_=>text[i]in{' ':1,'\t':1,'\n':1,'#':1}
	const sw=_=>{while(iw())if(text[i]=='#')while(i<text.length&&text[i]!='\n')nc();else nc()}
	const id=_=>0<='0123456789'.indexOf(text[i])
	//          !"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~
	const tcc=' s" sss ()ssssdsdddddddddd: sssn@nnnnnnnnnnnnnnnnnnnnnnnnnn[ ]sn nnnnnnnnnnnnnnnnnnnnnnnnnn s s'
	const ncc='                nnnnnnnnnn     n nnnnnnnnnnnnnnnnnnnnnnnnnn    n nnnnnnnnnnnnnnnnnnnnnnnnnn    '
	const mcc='     xx x xxxx x          x xxx x                          x  x                             x x'
	const esc={'\\':'\\','"':'"','n':'\n'}
	const ne=_=>{const e=nc();return esc[e]?esc[e]: er(`Invalid escape character '\\${e}' in string.`)}
	const nw=x=>{let v=+x;    while(id())v=(v*10)+(+nc());  return v} 
	const nf=_=>{let v=0,p=10;while(id())v+=(+nc())/p,p*=10;return v}
	const nn=(x,tr,tc,v,sign)=>{
		if(x=='.'&&!id())return{t:'.',r:tr,c:tc}
		if(x=='.')v=nf();else v=nw(x),v+=(text[i]=='.')?(nc(),nf()):0
		return {t:'number',v:sign*v,r:tr,c:tc}
	}
	const tok=_=>{
		const w=iw()||i==0||(mcc[text[i-1].charCodeAt(0)-32]=='x');sw();if(i>=text.length)return{t:'the end of the script'}
		const tr=r,tc=c, x=nc(), cc=tcc[x.charCodeAt(0)-32]; let v=0
		if(cc==' '||cc==undefined)er(`Invalid character '${x}'.`)
		if(x=='-'&&w&&tcc[(text[i]||'').charCodeAt(0)-32]=='d')return nn(nc(),r,c,v,-1)
		if(cc=='n'){let v=x; while(ncc[(text[i]||' ').charCodeAt(0)-32]=='n')v+=nc();return {t:'name',v,r:tr,c:tc}}
		if(cc=='"'){let v='',c;while(i<text.length&&(c=nc())!='"')v+=(c=='\\'?ne():clchar(c));return{t:'string',v,r:tr,c:tc}}
		return cc=='s'?{t:'symbol',v:x,r:tr,c:tc}: cc=='d'?nn(x,tr,tc,v,1):{t:x,r:tr,c:tc}
	}
	const peek=_=>{if(!tq)tq=tok();return tq}
	const hasnext=_=>peek().t!='the end of the script'
	const peek2=_=>{const pi=i,pr=r,pc=c,pq=tq;next();const v=peek();i=pi,r=pr,c=pc,tq=pq;return v}
	const next=_=>{if(tq){const r=tq;tq=null;return r};return tok()}
	const matchp=k=>peek().t=='name'&&peek().v==k
	const match=k=>matchp(k)?(next(),1):0
	const matchsp=k=>peek().t==k?(next(),1):0
	const expect=t=>peek().t==t?next().v:er(`Expected ${t}, but found ${peek().t}.`)
	const ident=n=>{
		const kw={while:1,each:1,send:1,on:1,if:1,elseif:1,else:1,end:1,do:1,with:1,local:1,select:1,extract:1,update:1,insert:1,
			into:1,from:1,where:1,by:1,orderby:1,asc:1,desc:1};return !(kw.hasOwnProperty(n)||monad.hasOwnProperty(n)||dyad.hasOwnProperty(n))
	}
	const name=n=>{const r=expect('name');if(!ident(r)&&n!='member')er(`'${r}' is a keyword, and cannot be used for a ${n} name.`);return r}
	const names=(x,n)=>{const r=[];while(!match(x))r.push(name(n));return r}
	const quote=_=>{const r=lmblk();expr(r);blk_end(r);return r}
	const block=_=>{const r=lmblk();iblock(r);return r}
	const quotesub=_=>{let c=0,r=lmblk();while(hasnext()&&!matchsp(']'))expr(r),c++;blk_opa(r,op.BUND,c);return r}
	const quotedot=_=>{const r=lmblk();blk_lit(r,lml([lms(name('member'))]));return r}
	const iblock=r=>{let c=0;while(hasnext()){if(match('end')){if(!c)blk_lit(r,NONE);return}if(c)blk_op(r,op.DROP);expr(r),c++};er(`Expected 'end' for block.`)}
	const parseclause=(b,func)=>{
		const iter_group=(g,f)=>{if(g){const n=tempname();blk_loop(b,[ls(n)],_=>{blk_get(b,n),f()})}else{f()}}
		if(match('where')){
			const ex=quote(),grouped=parseclause(b,func)
			iter_group(grouped,_=>{blk_lit(b,ex),blk_op(b,op.COL),blk_op2(b,'@where')});return grouped
		}
		if(match('orderby')){
			const ex=quote(),dir=match('asc')?-1: match('desc')?1: er(`Expected 'asc' or 'desc'.`), grouped=parseclause(b,func)
			iter_group(grouped,_=>{blk_lit(b,ex),blk_op(b,op.COL),blk_lit(b,lmn(dir)),blk_op3(b,'@orderby')});return grouped
		}
		if(match('by')){
			const ex=quote(),grouped=parseclause(b,func);if(grouped)blk_op1(b,'raze')
			blk_lit(b,ex),blk_op(b,op.COL),blk_op2(b,'@by');return 1
		}
		if(!match('from'))er(`Expected 'from'.`);expr(b),blk_op1(b,'@tab'),blk_op(b,op.DUP);return 0
	}
	const parsequery=(b,func,dcol)=>{
		const cols=lmd([],[]);while(!matchp('from')&&!matchp('where')&&!matchp('by')&&!matchp('orderby')){
			let set=peek2().t==':', lit=peek().t=='string', name=lms(lit?(set?peek().v:''):peek().t=='name'?peek().v:'')
			let get=ident(ls(name)), unique=ls(name).length&&dkix(cols,name)==-1; if(set&&lit&&!unique)next(),next()
			const x=set&&unique?(next(),next(),name): get&&unique&&dcol?name: lms(dcol?`c${cols.k.length}`: '')
			cols.k.push(x),cols.v.push(quote())
		}
		const grouped=parseclause(b,func), index=lmblk();blk_get(index,lms('index'))
		const keys=lml(cols.k.concat([lms('@index')])),n=tempname();if(!grouped)blk_op1(b,'list')
		blk_loop(b,[ls(n)],_=>{
			blk_lit(b,keys),blk_get(b,n),cols.v.map(x=>(blk_lit(b,x),blk_op(b,op.COL)))
			blk_lit(b,index),blk_op(b,op.COL),blk_op(b,op.DROP),blk_opa(b,op.BUND,count(keys)),blk_op2(b,'dict')
		}),blk_lit(b,keys),blk_op3(b,func)
	}
	const parseindex=(b,name)=>{
		const i=[];while(({'[':1,'.':1})[peek().t]){
			if(matchsp('['))i.push(quotesub())
			if(matchsp('.')){
				if(({'[':1,'.':1})[peek().t]){
					const vn=tempname()
					i.map(v=>(blk_cat(b,v),blk_op(b,op.CALL))),blk_loop(b,[vn.v],_=>{blk_get(b,vn),parseindex(b)});return
				}else{i.push(quotedot())}
			}
		}
		if(matchsp(':')){
			i.map(v=>blk_cat(b,v)),blk_opa(b,op.BUND,i.length),blk_op(b,op.OVER)
			for(let z=0;z<i.length-1;z++)blk_opa(b,op.IPRE,z),blk_opa(b,op.IPOST,z);expr(b),blk_imm(b,op.AMEND,name||NONE)
		}else{i.map(v=>(blk_cat(b,v),blk_op(b,op.CALL)))}
	}
	const term=b=>{
		if(peek().t=='number'){blk_lit(b,lmn(next().v));return}
		if(peek().t=='string'){blk_lit(b,lms(next().v));return}
		if(match('if')){
			const fin=[];let c=0,e=0,next=-1;expr(b);next=blk_opa(b,op.JUMPF,0);while(hasnext()){
				if(match('elseif')){
					if(e)er(`Expected 'end'.`)
					if(!c)blk_lit(b,NONE);c=0;fin.push(blk_opa(b,op.JUMP,0)),blk_sets(b,next,blk_here(b)),expr(b),next=blk_opa(b,op.JUMPF,0);continue
				}
				if(match('else')){
					if(e)er(`Expected 'end'.`)
					if(!c)blk_lit(b,NONE);c=0,e=1;fin.push(blk_opa(b,op.JUMP,0)),blk_sets(b,next,blk_here(b)),next=-1;continue
				}
				if(match('end')){
					if(!c)blk_lit(b,NONE);c=0;if(!e)fin.push(blk_opa(b,op.JUMP,0));if(next!=-1)blk_sets(b,next,blk_here(b));if(!e)blk_lit(b,NONE)
					fin.map(x=>blk_sets(b,x,blk_here(b)));return
				}
				if(c)blk_op(b,op.DROP);expr(b),c++
			}
		}
		if(match('while')){
			blk_lit(b,NONE);const head=blk_here(b);expr(b);const cond=blk_opa(b,op.JUMPF,0)
			blk_op(b,op.DROP),iblock(b),blk_opa(b,op.JUMP,head),blk_sets(b,cond,blk_here(b));return
		}
		if(match('each')){const n=names('in','variable');expr(b),blk_loop(b,n,_=>iblock(b));return}
		if(match('on')){
			const n=name('function'),v=matchsp('.')&&matchsp('.')&&matchsp('.');let a=names('do','argument')
			if(v&&a.length!=1)return er(`Variadic functions must take exactly one named argument.`);if(v)a=['...'+a[0]]
			blk_lit(b,lmon(n,a,blk_end(block()))),blk_op(b,op.BIND);return
		}
		if(match('send')){
			blk_lit(b,lmnat(n_uplevel)),blk_lit(b,lml([lms(name('function'))])),blk_op(b,op.CALL)
			expect('['),blk_cat(b,quotesub()),blk_op(b,op.CALL);return
		}
		if(match('local')){const n=lms(name('variable'));expect(':'),expr(b),blk_loc(b,n);return}
		if(match('select' )){parsequery(b,'@sel',1);return}
		if(match('extract')){parsequery(b,'@ext',0);return}
		if(match('update' )){parsequery(b,'@upd',1);return}
		if(match('insert')){
			const n=lml([]);while(!match('with')){n.v.push(lms(peek().t=='string'?next().v:name('column')))}
			let v=0,i=0;while(1){if(match('into')){i=1;break}if(match('end')){i=0;break}expr(b),v++}
			if(n.v.length<1)n.v.push(lms('value'));blk_opa(b,op.BUND,v),blk_lit(b,n);if(i){expr(b)}else{blk_lit(b,NONE)}
			blk_op3(b,'@ins');return
		}
		if(matchsp('(')){if(matchsp(')')){blk_lit(b,lml([]));return}expr(b),expect(')');return}
		const s=peek().v;if(findop(s,monad)>=0&&({'symbol':1,'name':1})[peek().t]){
			next();if(matchsp('@')){
				let depth=0,l=lmblk();while(matchsp('@'))depth++
				expr(b),blk_opa(l,op.FMAP,findop(s,monad))
				while(depth-->0){const t=tempname(),m=lmblk();blk_loop(m,[ls(t)],_=>{blk_get(m,t),blk_cat(m,l)}),l=m}
				blk_cat(b,l)
			}else{expr(b),blk_op1(b,s)};return
		}const n=lms(name('variable'));if(matchsp(':')){expr(b),blk_set(b,n);return}blk_get(b,n),parseindex(b,n)
	}
	const expr=b=>{
		term(b);if(({'[':1,'.':1})[peek().t]){parseindex(b)}
		if(matchsp('@')){
			let depth=0;while(matchsp('@'))depth++
			const func=tempname();blk_set(b,func),blk_op(b,op.DROP),expr(b)
			let l=lmblk();blk_get(l,func),blk_op(l,op.SWAP);const fidx=blk_opa(l,op.FIDX,0)
			blk_loop(l,['v'],_=>{blk_get(l,func),blk_get(l,lms('v')),blk_opa(l,op.BUND,1),blk_op(l,op.CALL)})
			blk_sets(l,fidx,blk_here(l))
			while(depth-->0){const t=tempname(),m=lmblk();blk_loop(m,[ls(t)],_=>{blk_get(m,t),blk_cat(m,l)}),l=m}
			blk_cat(b,l);return
		}const s=peek().v;if(findop(s,dyad)>=0&&({'symbol':1,'name':1})[peek().t]){next(),expr(b),blk_op2(b,s)}
	}
	const b=lmblk();if(hasnext())expr(b);while(hasnext())blk_op(b,op.DROP),expr(b)
	if(blk_here(b)==0)blk_lit(b,NONE);return b
}

export const env_local=(e,n,x)=>{e.v.set(ls(n),x)}
export const env_getr =(e,n  )=>{const k=ls(n);r=e.v.get(k);return r?r: e.p?env_getr(e.p,n): null}
export const env_setr =(e,n,x)=>{const k=ls(n);r=e.v.get(k);return r?e.v.set(k,x): e.p?env_setr(e.p,n,x): null}
export const env_get  =(e,n  )=>env_getr(e,n)||NONE
export const env_set  =(e,n,x)=>{const r=env_getr(e,n);r?env_setr(e,n,x):env_local(e,n,x)}
export const env_bind =(e,k,v)=>{const r=lmenv(e); k.map((a,i)=>env_local(r,lms(a),v.v[i]||NONE));return r}
const monadi=Object.values(monad), dyadi=Object.values(dyad), triadi=Object.values(triad), states=[]; let state=null
export const pushstate=env=>{if(state){states.push(state)};state={e:[env],p:[],t:[],pcs:[]}}
export const popstate =_=>{state=states.pop()}
export const halt     =_=>{state.p=[],state.t=[],state.e=[state.e[0]]}
export const running  =_=>state.t.length>0
export const getev    =_=>state.e  [state.e  .length-1]
export const getblock =_=>state.t  [state.t  .length-1]
export const getpc    =_=>state.pcs[state.pcs.length-1]
export const setpc    =x=>state.pcs[state.pcs.length-1]=x
export const issue    =(env,blk)=>(state.e.push(env),state.t.push(blk),state.pcs.push(0))
export const descope  =_=>(state.e.pop(),state.t.pop(),state.pcs.pop())
export const ret      =x=>state.p.push(x)
export const arg      =_=>state.p.pop()
export const docall=(f,a,tail)=>{
	if(linat(f)){ret(f.f(ll(a)));return}
	if(!lion(f)){ret(l_at(f,monad.first(a)));return}
	if(tail){descope()}
	issue(f.a.length==1&&f.a[0][0]=='.'?env_bind(f.c,[f.a[0].slice(3)],monad.list(a)): env_bind(f.c,f.a,a),f.b)
	calldepth=max(calldepth,state.e.length)
}
export const runop=_=>{
	const b=getblock();if(!liblk(b))ret(state.t.pop())
	const pc=getpc(),o=blk_getb(b,pc),imm=(oplens[o]==3?blk_gets(b,1+pc):0); setpc(pc+oplens[o])
	switch(o){
		case op.DROP :arg();break
		case op.DUP  :{const a=arg();ret(a),ret(a);break}
		case op.SWAP :{const a=arg(),b=arg();ret(a),ret(b);break}
		case op.OVER :{const a=arg(),b=arg();ret(b),ret(a),ret(b);break}
		case op.JUMP :setpc(imm);break
		case op.JUMPF:if(!lb(arg()))setpc(imm);break
		case op.LIT  :ret(blk_getimm(b,imm));break
		case op.GET  :{ret(env_get(getev(),blk_getimm(b,imm)));break}
		case op.SET  :{const v=arg();env_set(getev(),blk_getimm(b,imm),v),ret(v);break}
		case op.LOC  :{const v=arg();env_local(getev(),blk_getimm(b,imm),v),ret(v);break}
		case op.BUND :{const r=[];for(let z=0;z<imm;z++)r.push(arg());r.reverse(),ret(lml(r));break}
		case op.OP1  :{                      ret(monadi[imm](arg()    ));break}
		case op.OP2  :{const         y=arg();ret(dyadi [imm](arg(),y  ));break}
		case op.OP3  :{const z=arg(),y=arg();ret(triadi[imm](arg(),y,z));break}
		case op.IPRE :{const s=arg(),i=arg();ret(i),docall(s,i.v[imm]);if(lion(s)||lii(s)||linat(s)){for(let z=0;z<=imm;z++)i.v[z]=null}break}
		case op.IPOST:{const s=arg(),i=arg(),r=arg();ret(i.v[imm]?r:s),ret(i),ret(s);break}
		case op.AMEND:{
			let v=arg(),r=arg(),i=ll(arg()),ro=arg(),n=blk_getimm(b,imm),t={v:1}
			if(i.length&&!i[0]){i=i.filter(x=>x),t.v=0}r=amendv(ro,i,v,0,t);if(t.v&&!lin(n))env_set(getev(),n,r);ret(r);break
		}
		case op.CALL : // fall through:
		case op.TAIL :{const a=arg(),f=arg();docall(f,a,o==op.TAIL);break}
		case op.BIND :{const f=arg(),r=lmon(f.n,f.a,f.b);r.c=getev(),env_local(getev(),lms(f.n),r),ret(r);break}
		case op.ITER :{const x=arg();ret(lil(x)?x:ld(x));ret(lid(x)?lmd():lml([]));break}
		case op.FIDX :{const x=arg(),f=arg();if((lid(f)||lil(f)||lis(f))&&lil(x)){ret(lml(x.v.map(x=>l_at(f,x))));setpc(imm)}else{ret(x)};break}
		case op.FMAP :{const x=arg(),f=monadi[imm];ret(lid(x)?lmd(x.k,x.v.map(f)):lml(ll(x).map(f)));break}
		case op.EACH :{
			const n=arg(),r=arg(),s=arg();if(count(r)==count(s)){setpc(imm),ret(r);break}
			const z=count(r), v=lml([s.v[z],lid(s)?s.k[z]:lmn(z),lmn(z)]);
			state.e.push(env_bind(getev(),n,v)),ret(s),ret(r);break
		}
		case op.NEXT :{const v=arg(),r=arg(),s=arg();state.e.pop();if(lid(r))r.k.push(s.k[r.v.length]);r.v.push(v),ret(s),ret(r),setpc(imm);break}
		case op.COL  :{
			const ex=arg(),t=arg(),n=tab_cols(t),v=ll(monad.cols(t));ret(t)
			n.push('column'),v.push(t),issue(env_bind(getev(),n,lml(v)),ex);break
		}
	}while(running()&&getpc()>=blk_here(getblock()))descope()
}

export const fchar=x=>x=='I'?'i': x=='B'?'b': x=='L'?'s': x
export const n_writecsv=([x,y,d])=>{
	let r='', spec=y?ls(y).split(''):[];const t=lt(x), c=tab_cols(t).length; d=d?ls(d)[0]:','
	while(spec.length<c)spec.push('s')
	let n=0;spec.forEach((x,i)=>{if(x=='_')return;if(n)r+=d;n++;r+=tab_cols(t)[i]||`c${i+1}`})
	rows(t).v.forEach(row=>{
		r+='\n';let n=0;spec.forEach((x,i)=>{
			if(x=='_')return;if(n)r+=d;n++
			const vv=row.v[i], fc=fchar(x), sv=dyad.format(lms('%'+fc),fc=='j'||fc=='a'?monad.list(vv):vv).v
			r+=(/["\n]/.test(sv)||sv.indexOf(d)>=0?`"${sv.replace(/"/g,'""')}"`:sv)
		})
	});return lms(r)
}
export const n_readcsv=([x,y,d])=>{
	let i=0,n=0, spec=y&&lis(y)?ls(y):null, text=count(x)?ls(x):'', r=lmt(); d=d?ls(d)[0]:','
	const nv=_=>{let r='';while(text[i]&&text[i]!='\n'&&text[i]!=d)r+=text[i++];return r}, match=x=>text[i]==x?(i++,1):0
	while(i<text.length&&text[i]!='\n'){
		while(match(' '));const v=nv();if(!spec||(n<spec.length&&spec[n]!='_'))tab_set(r,v,[]);n++;if(match('\n'))break;while(match(' '));match(d)
	}
	while(spec&&n<spec.length){if(spec[n]!='_'){tab_set(r,'c'+n,[])};n++}
	if(!spec)spec='s'.repeat(tab_cols(r).length)
	let slots=0,slot=0;spec.split('').map(z=>{if(z!='_')slots++;});slots=min(slots,tab_cols(r).length),n=0
	if(i>=text.length)return r;while(i<=text.length){
		while(match(' '));
		let val='';if(match('"')){while(text[i]){if(match('"')){if(match('"')){val+='"'}else{break}}else{val+=text[i++]}}}else{val=nv()}
		if(spec[n]&&spec[n]!='_'){
			const k=tab_cols(r)[slot], x=(val[0]||'').toLowerCase(), s=spec[n]
			let sign=1,o=0; if(val[o]=='-')sign=-1,o++;if(val[o]=='$')o++;
			tab_get(r,k).push(dyad.parse(lms('%'+fchar(s)),lms(val))),slot++
		};n++
		if(i>=text.length||text[i]=='\n'){
			while(n<spec.length){const u=spec[n++];if(u!='_'&&slot<slots)tab_get(r,tab_cols(r)[slot++]).push('sluvroq'.indexOf(u)>=0?lms(''):NONE);}
			if(text[i]=='\n'&&i==text.length-1)break;i++,n=0,slot=0
		}else{while(match(' '));match(d)}
	};return r
}
export const n_writexml=([x,fmt])=>{
	fmt=fmt?lb(fmt):0
	const esc=x=>{const e={'&':'amp',"'":'apos','"':'quot','<':'lt','>':'gt'};return ls(x).replace(/[&'"<>]/g,x=>e[x]?`&${e[x]};`:x)}
	const rec=(x,tab)=>{
		if(array_is(x)){
			const ck=lms('cast'),c=ifield(x,'cast');iwrite(x,ck,lms('char'))
			const r=iwrite(x,lml([NONE,ifield(x,'size')]));iwrite(x,ck,c);return ls(r)
		}
		if(lil(x))return x.v.map(x=>rec(x,tab)).join(''); if(!lid(x))return esc(x)+((tab&&fmt)?'\n':'')
		const t=ls(dget(x,lms('tag'))||lms('')),a=ld(dget(x,lms('attr'))||lmd()),c=ll(dget(x,lms('children'))||lml([]))
		const r=`<${t}${a.k.map((k,i)=>` ${ls(k)}="${esc(a.v[i])}"`).join('')}${c.length?'':'/'}>${fmt?'\n':''}`
		return c.length?`${r}${c.map(x=>(' '.repeat(fmt?tab+2:0))+rec(x,tab+2)).join('')}${' '.repeat(fmt?tab:0)}</${t}>${fmt?'\n':''}`:r
	};return lms(rec(x,0))
}
export const n_readxml=([x])=>{
	let i=0,t=ls(x)
	const xm=x=>t[i]==x?(i++,1):0
	const xc=_=>{while(t[i]&&t[i]!='>')i++;i++}
	const xs=_=>{let w=0;while(/[ \n]/.test(t[i]))i++,w=1;return w}
	const xe=(a,b)=>t.slice(i,i+2+a.length)==`&${a};`?(i+=2+a.length,b):null
	const name=_=>{let r='';xs();while(t[i]&&!/[>/= \n]/.test(t[i]))r+=t[i++];xs();return r.toLowerCase()}
	const text=stop=>{
		let r='';while(t[i]&&!(stop==' '&&/[>/ \n]/.test(t[i]))){
			if(xs())r+=' ';if(stop==t[i]||!t[i])break;r+=xe('amp','&')||xe('apos',"'")||xe('quot','"')||xe('lt','<')||xe('gt','>')||xe('nbsp',' ')||t[i++]
		}if(/['"]/.test(stop)&&t[i])i++;return lms(r)
	}
	const rec=ctag=>{
		let r=[];while(t[i]){
			const w=xs();if(t.slice(i,i+9)=='<![CDATA['){i+=9;let c='';while(t[i]&&t.slice(i,i+3)!=']]>')c+=t[i++];i+=3;r.push(lms(c));continue}
			if(t[i]!='<'){if(w)i--;r.push(text('<'));continue}i++,xs()
			if(xm('!')||xm('?')){xc();continue};if(xm('/')){const n=name();xm('>');if(ctag==n)break;continue}
			const tag=lmd(),attr=lmd(),n=name();r.push(tag),dset(tag,lms('tag'),lms(n)),dset(tag,lms('attr'),attr),dset(tag,lms('children'),lml([]))
			while(t[i]&&!/[>/]/.test(t[i])){const n=lms(name());if(xm('=')){xs(),dset(attr,n,text(xm("'")?"'":xm('"')?'"':' '))}else{dset(attr,n,ONE)}}
			if(xm('/')){xc()}else{if(t[i])i++;dset(tag,lms('children'),rec(n))}
		}return lml(r)
	}
	return rec('')
}
export const n_random=z=>{
	const randint=x=>{let y=seed;y^=(y<<13),y^=(y>>>17),(y^=(y<<15));return mod(seed=y,x);} // xorshift32
	const randelt=x=>lin(x)?lmn(randint(ln(x))): count(x)<1?NONE: l_at(x,lmn(randint(count(x))))
	let x=z[0]||NONE;if(lid(x))x=monad.range(x);if(z.length<2)return randelt(x)
	const y=ln(z[1]);if(y>=0){const r=[];for(let z=0;z<y;z++)r.push(randelt(x));return lml(r);}
	x=lin(x)?monad.range(x).v:ll(x);const p=range(x.length),r=[]
	for(let i=x.length-1;i>0;i--){const j=randint(i+1),t=p[j];p[j]=p[i],p[i]=t}
	for(let z=0;z<abs(y);z++)r.push(x[p[z%x.length]]);return lml(r)
}
let frame_count=0
export const interface_system=lmi((self,i,x)=>{
	if(!i)return NONE
	if(x){if(lis(i)&&i.v=='seed'){seed=0|ln(x);return x}}
	if(lis(i)&&i.v=='version'   )return lms(VERSION)
	if(lis(i)&&i.v=='platform'  )return lms('web')
	if(lis(i)&&i.v=='seed'      )return lmn(seed)
	if(lis(i)&&i.v=='frame'     )return lmn(frame_count)
	if(lis(i)&&i.v=='now'       )return lmn(0|(new Date().getTime()/1000))
	if(lis(i)&&i.v=='ms'        )return lmn(0|(Date.now()))
	if(lis(i)&&i.v=='workspace' )return lmd(['allocs','depth'].map(lms),[allocs,calldepth].map(lmn))
	return x?x:NONE
},'system')
export const showt=(x,toplevel)=>{
	if(!toplevel){
		const d=monad.rows(x).v.map(r=>r.v.map(v=>show(v)).join(' ')).join(' ')
		return `insert ${tab_cols(x).join(' ')} with ${d?d+' ':''}end`
	}
	try{
	const w=tab_cols(x).map(k=>tab_get(x,k).reduce((x,y)=>max(x,show(y).length+2),k.length+2))
	const s='+'+tab_cols(x).map((x,i)=>"-".repeat(w[i])).join('+')+'+'
	const v=range(tab_rowcount(x)).map(r=>tab_cols(x).map(k=>' '+show(tab_cell(x,k,r))).map((f,i)=>f+(' '.repeat(max(0,w[i]-f.length)))))
	         .map(x=>`|${x.join('|')}|`).join('\n')
	return `${s}\n|${tab_cols(x).map((x,i)=>` ${x+(' '.repeat(w[i]-x.length-2))} `).join('|')}|\n${s}${v.length?'\n'+v+'\n'+s:''}`
	}catch(err){console.log('cannot serialize',x);throw err}
}
export const show=(x,toplevel)=>linat(x)?'on native x do ... end':
		lil(x)?`(${x.v.map(x=>show(x)).join(',')})`: lit(x)?showt(x,toplevel): lion(x)?`on ${x.n}${x.a.map(x=>' '+x).join('')} do ... end`:
		lis(x)?`"${x.v.split('').map(x=>({'\n':'\\n','\\':'\\\\','"':'\\"'})[x]||x).join('')}"`:
		lin(x)?fjson(x):lid(x)?`{${x.k.map((k,i)=>`${show(k)}:${show(x.v[i])}`).join(',')}}`:
		lii(x)?`<${x.n}>`:`<INVALID ${x}>`

// dom + utilities

export const FORMAT_VERSION=1
export const RTEXT_END=2147483647
export const SFX_RATE=8000
export const ANTS=255
export const MODULE_QUOTA=10*4096
export const FRAME_QUOTA=MODULE_QUOTA
export const TRANS_QUOTA=2*4096
export const LOOP_QUOTA=1*4096
export const ATTR_QUOTA=1*4096
export const BRUSH_QUOTA=128
export const sleep_frames=0
export const sleep_play=0
export const pending_popstate=0
export const DEFAULT_HANDLERS=`
on link x do go[x] end
on drag x do if !me.locked|me.draggable me.line[(pointer.prev-me.offset)/me.scale x] end end
on order x do if !me.locked me.value:select orderby me.value[x] asc from me.value end end
on changecell x do
	f:me.format[me.col] f:if count f f else "s" end
	me.cellvalue:("%%%l" format f) parse x
	me.event["change" me.value]
end
on navigate x do if x~"right" go["Next"] end if x~"left" go["Prev"] end end
on loop x do x end
`
export const DEFAULT_TRANSITIONS=`
transition[on SlideRight c a b t do  c.paste[a c.size*t,0   ] c.paste[b c.size*(t-1),0]      end]
transition[on SlideLeft  c a b t do  c.paste[a c.size*(-t),0] c.paste[b c.size*(1-t),0]      end]
transition[on SlideDown  c a b t do  c.paste[a c.size*0,t   ] c.paste[b c.size*0,t-1  ]      end]
transition[on SlideUp    c a b t do  c.paste[a c.size*0,-t  ] c.paste[b c.size*0,1-t  ]      end]
transition[on WipeRight  c a b t do  c.rect[0,0        c.size*t,1    ]          c.merge[a b] end]
transition[on WipeLeft   c a b t do  c.rect[0,0        c.size*(1-t),1]          c.merge[b a] end]
transition[on WipeDown   c a b t do  c.rect[0,0        c.size*1,t    ]          c.merge[a b] end]
transition[on WipeUp     c a b t do  c.rect[0,0        c.size*1,1-t  ]          c.merge[b a] end]
transition[on BoxIn      c a b t do  c.rect[c.size/2   c.size*t   "center"]     c.merge[a b] end]
transition[on BoxOut     c a b t do  c.rect[c.size/2   c.size*1-t "center"]     c.merge[b a] end]
`
export const FONTS={
	body:'%%FNT0CAoBAQAAAAAAAAAAAAABAICAgICAAIAAAAMAoKAAAAAAAAAABQAAUPhQ+FAAAAAFIHCooHAoqHAgAAgAf5KUbhk'+
	'pRgAABzBIUCBUiJRiAAABAICAAAAAAAAAAAMgQICAgICAQCAAA4BAICAgICBAgAAFAFAg+CBQAAAAAAUAACAg+CAgAAAA'+
	'AgAAAAAAAABAQIAEAAAAAPAAAAAAAAEAAAAAAAAAgAAABBAQICBAQICAAAAFAHCIiIiIiHAAAAUAIGAgICAgIAAABQBwi'+
	'AgQIED4AAAFAPgQIHAIiHAAAAUAEDBQkPgQEAAABQD4gPAICIhwAAAFADBAgPCIiHAAAAUA+AgQECAgIAAABQBwiIhwiI'+
	'hwAAAFAHCIiHgIEGAAAAMAAABAAAAAQAAABAAAACAAAAAgIEAEAAAQIEAgEAAAAAUAAAD4APgAAAAABAAAQCAQIEAAAAA'+
	'FADBICBAgACAAAAcAOESaqqqcQDgABQAgIFBQ+IiIAAAFAPCIiPCIiPAAAAUAcIiAgICIcAAABQDgkIiIiJDgAAAEAPCA'+
	'gOCAgPAAAAQA8ICA4ICAgAAABQBwiICYiIhwAAAFAIiIiPiIiIgAAAIAQEBAQEBAQAAABQAICAgIiIhwAAAFAIiQoMCgk'+
	'IgAAAQAgICAgICA8AAABwCCxqqSgoKCAAAFAMjIqKiYmIgAAAUAcIiIiIiIcAAABQDwiIjwgICAAAAFAHCIiIiIqHAQAA'+
	'UA8IiI8KCQiAAABQBwiIBwCIhwAAAFAPggICAgICAAAAUAiIiIiIiIcAAABQCIiIhQUCAgAAAHAIKCVFQoKCgAAAUAiIh'+
	'QIFCIiAAABQCIiFAgICAgAAAEAPAQIECAgPAAAANgQEBAQEBAQGAABICAQEAgIBAQAAADYCAgICAgICBgAAMAQKAAAAAA'+
	'AAAABgAAAAAAAAD8AAACAIBAAAAAAAAAAAQAAABgEHCQcAAABACAgOCQkJDgAAAEAAAAYJCAkGAAAAQAEBBwkJCQcAAAB'+
	'AAAAGCQ8IBgAAAEADBA4EBAQEAAAAQAAABwkJCQcBBgBACAgOCQkJCQAAACAEAAwEBAQEAAAAMAIABgICAgICDABACAgJ'+
	'CgwKCQAAACAMBAQEBAQEAAAAcAAADskpKSkgAABAAAAOCQkJCQAAAEAAAAYJCQkGAAAAQAAADgkJCQ4ICABAAAAHCQkJB'+
	'wEBAEAAAAsMCAgIAAAAQAAABwgGAQ4AAAAwBAQOBAQEAgAAAEAAAAkJCQkHAAAAUAAACIUFAgIAAABwAAAIJUVCgoAAAF'+
	'AAAAiFAgUIgAAAQAAACQkJCQcBBgBAAAAPAgQIDwAAADIEBAQIBAQEAgAAGAgICAgICAgIAAA4BAQEAgQEBAgAAFAGiwA'+
	'AAAAAAAAAUAAAAAAAAAqAAA',
	menu:'%%FNT0EA0BAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAwADAAMAAwADAAMAAAADAAMAAAAAAAAAAAwAAoACgAKA'+
	'AAAAAAAAAAAAAAAAAAAAAAAAACBIAEgB/ACQAJAD+AEgASAAAAAAAAAAAAAAABSAAcACoAOAA4ABwADgAOACoAHAAIAAA'+
	'AAAACW4AkgCUAGQACAAIABMAFIAkgCMAAAAAAAAACAAAeADMAM0AYQDOAMwAzADMAHgAAAAAAAAAAQAAgACAAIAAAAAAA'+
	'AAAAAAAAAAAAAAAAAAAAyAAQADAAMAAwADAAMAAwADAAEAAIAAAAAAAA4AAQABgAGAAYABgAGAAYABgAEAAgAAAAAAABQ'+
	'AAIACoAHAAqAAgAAAAAAAAAAAAAAAAAAAABQAAAAAAACAAIAD4ACAAIAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAD'+
	'AAMAAQACAAAAABQAAAAAAAAAAAAD4AAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAADAAMAAAAAAAAAABQgACAAQ'+
	'ABAAIAAgAEAAQACAAIAAAAAAAAAABgAAeADMAMwAzADMAMwAzADMAHgAAAAAAAAABgAAMABwADAAMAAwADAAMAAwADAAA'+
	'AAAAAAABgAAeACMAAwADAAYADAAYADAAPwAAAAAAAAABgAA/AAYADAAeAAMAAwADACMAHgAAAAAAAAABwAADAAcACwATA'+
	'CMAP4ADAAMAAwAAAAAAAAABgAA/ADAAMAA+AAMAAwADACMAHgAAAAAAAAABgAAOABgAMAA+ADMAMwAzADMAHgAAAAAAAA'+
	'ABgAA/AAMAAwADAAYADAAMAAwADAAAAAAAAAABgAAeADMAMwAzAB4AMwAzADMAHgAAAAAAAAABgAAeADMAMwAzADMAHwA'+
	'DAAYAHAAAAAAAAAAAgAAAAAAAMAAwAAAAAAAAADAAMAAAAAAAAAAAgAAAAAAAMAAwAAAAAAAAADAAMAAQACAAAAABQAAA'+
	'AAYADAAYADAAGAAMAAYAAAAAAAAAAAABgAAAAAAAAAA/AAAAPwAAAAAAAAAAAAAAAAABQAAAADAAGAAMAAYADAAYADAAA'+
	'AAAAAAAAAABgAAeACMAAwAGAAwADAAAAAwADAAAAAAAAAACQAAAAA+AEEAnICkgKSAmwBAAD4AAAAAAAAABgAAeADMAMw'+
	'AzAD8AMwAzADMAMwAAAAAAAAABgAA+ADMAMwAzAD4AMwAzADMAPgAAAAAAAAABgAAeADEAMAAwADAAMAAwADEAHgAAAAA'+
	'AAAABgAA+ADMAMwAzADMAMwAzADMAPgAAAAAAAAABQAA+ADAAMAAwADwAMAAwADAAPgAAAAAAAAABQAA+ADAAMAAwADwA'+
	'MAAwADAAMAAAAAAAAAABgAAeADEAMAAwADcAMwAzADMAHgAAAAAAAAABgAAzADMAMwAzAD8AMwAzADMAMwAAAAAAAAAAg'+
	'AAwADAAMAAwADAAMAAwADAAMAAAAAAAAAABgAADAAMAAwADAAMAMwAzADMAHgAAAAAAAAABwAAxgDMANgA8ADgAPAA2AD'+
	'MAMYAAAAAAAAABQAAwADAAMAAwADAAMAAwADAAPgAAAAAAAAACgAAgEDAwOHA88C+wJzAiMCAwIDAAAAAAAAABwAAggDC'+
	'AOIA8gC6AJ4AjgCGAIIAAAAAAAAABgAAeADMAMwAzADMAMwAzADMAHgAAAAAAAAABgAA+ADMAMwAzAD4AMAAwADAAMAAA'+
	'AAAAAAABgAAeADMAMwAzADMAMwAzADMAHgADAAAAAAABgAA+ADMAMwAzAD4AMwAzADMAMwAAAAAAAAABQAAcADIAMAA4A'+
	'BwADgAGACYAHAAAAAAAAAABgAA/AAwADAAMAAwADAAMAAwADAAAAAAAAAABgAAzADMAMwAzADMAMwAzADMAHgAAAAAAAA'+
	'ABgAAzADMAMwAzADMAMwAzADIAPAAAAAAAAAACgAAzMDMwMzAzMDMwMzAzMDMgP8AAAAAAAAABgAAzADMAMwAzAB4AMwA'+
	'zADMAMwAAAAAAAAABgAAzADMAMwAzAB4ADAAMAAwADAAAAAAAAAABgAA/AAMAAwAGAAwAGAAwADAAPwAAAAAAAAAA+AAw'+
	'ADAAMAAwADAAMAAwADAAMAA4AAAAAAABYAAgABAAEAAIAAgABAAEAAIAAgAAAAAAAAAA+AAYABgAGAAYABgAGAAYABgAG'+
	'AA4AAAAAAABQAAIABQAIgAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAP8AAAAAAAAAA4AAQAAgAAA'+
	'AAAAAAAAAAAAAAAAAAAAAAAAABgAAAAAAAHgAjAB8AMwAzADMAHwAAAAAAAAABgAAwADAAPgAzADMAMwAzADMAPgAAAAA'+
	'AAAABQAAAAAAAHAAyADAAMAAwADIAHAAAAAAAAAABgAADAAMAHwAzADMAMwAzADMAHwAAAAAAAAABgAAAAAAAHgAzADMA'+
	'PwAwADEAHgAAAAAAAAABQAAOABgAPAAYABgAGAAYABgAGAAAAAAAAAABgAAAAAAAHwAzADMAMwAzADMAHwADACMAHgABg'+
	'AAwADAAPgAzADMAMwAzADMAMwAAAAAAAAAAgAAwAAAAMAAwADAAMAAwADAAMAAAAAAAAAABQAAGAAAABgAGAAYABgAGAA'+
	'YABgAGACYAHAABgAAwADAAMwA2ADwAOAA8ADYAMwAAAAAAAAAAgAAwADAAMAAwADAAMAAwADAAMAAAAAAAAAACgAAAAAA'+
	'AP+AzMDMwMzAzMDMwMzAAAAAAAAABgAAAAAAAPgAzADMAMwAzADMAMwAAAAAAAAABgAAAAAAAHgAzADMAMwAzADMAHgAA'+
	'AAAAAAABgAAAAAAAPgAzADMAMwAzADMAPgAwADAAAAABgAAAAAAAHwAzADMAMwAzADMAHwADAAMAAAABQAAAAAAANgA4A'+
	'DAAMAAwADAAMAAAAAAAAAABQAAAAAAAHAAyADgAHAAOACYAHAAAAAAAAAABAAAYABgAPAAYABgAGAAYABgADAAAAAAAAA'+
	'ABgAAAAAAAMwAzADMAMwAzADMAHwAAAAAAAAABgAAAAAAAMwAzADMAMwAzADIAPAAAAAAAAAACgAAAAAAAMzAzMDMwMzA'+
	'zMDMgP8AAAAAAAAABgAAAAAAAMwAzADMAHgAzADMAMwAAAAAAAAABgAAAAAAAMwAzADMAMwAzADMAHwADACMAHgABgAAA'+
	'AAAAPwADAAYADAAYADAAPwAAAAAAAAAAyAAQABAAEAAQACAAEAAQABAAEAAIAAAAAAAAYAAgACAAIAAgACAAIAAgACAAI'+
	'AAgAAAAAAAA4AAQABAAEAAQAAgAEAAQABAAEAAgAAAAAAABgAAAAAAAGQAmAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAA'+
	'AAAAAAAAAAADbANsAAAAAAAAA',
	mono:'%%FNT0CAsBBQAAAAAAAAAAAAAABQAAICAgICAAIAAABQAAUFBQAAAAAAAABQAAUPhQ+FAAAAAABQAgcKigcCiocCAABQA'+
	'ASKhQIFCokAAABQAAYJCgQKiQaAAABQAgICAAAAAAAAAABQAQICBAQEAgIBAABQAgEBAICAgQECAABQAAIKhwqCAAAAAA'+
	'BQAAACAg+CAgAAAABQAAAAAAAABgYCBABQAAAAAA+AAAAAAABQAAAAAAAAAwMAAABQgIEBAgIEBAgIAABQAAcIiYqMiIc'+
	'AAABQAAIGAgICAgIAAABQAAcIgIECBA+AAABQAAcIgIMAiIcAAABQAAEDBQkPgQEAAABQAA+IDwCAiIcAAABQAAcIDwiI'+
	'iIcAAABQAA+AgIECAgIAAABQAAcIiIcIiIcAAABQAAcIiIiHgIcAAABQAAADAwAAAwMAAABQAAAGBgAABgYCBABQAACBA'+
	'gQCAQCAAABQAAAAD4APgAAAAABQAAQCAQCBAgQAAABQAAcIgIECAAIAAABQBwiIio6LCAiHAABQAAcIiI+IiIiAAABQAA'+
	'8IiI8IiI8AAABQAAcIiAgICIcAAABQAA8IiIiIiI8AAABQAA+ICA8ICA+AAABQAA+ICA8ICAgAAABQAAcIiAmIiIcAAAB'+
	'QAAiIiI+IiIiAAABQAAICAgICAgIAAABQAACAgICIiIcAAABQAAiJCgwKCQiAAABQAAgICAgICA+AAABQAAiNioiIiIiA'+
	'AABQAAiMiomIiIiAAABQAAcIiIiIiIcAAABQAA8IiI8ICAgAAABQAAcIiIiIiIcAgABQAA8IiI8IiIiAAABQAAcIiAcAi'+
	'IcAAABQAA+CAgICAgIAAABQAAiIiIiIiIcAAABQAAiIiIUFAgIAAABQAAiIiIiKjYiAAABQAAiFAgICBQiAAABQAAiIiI'+
	'UCAgIAAABQAA+AgQIECA+AAABQAwICAgICAgIDAABYCAQEAgIBAQCAgABQAwEBAQEBAQEDAABQAgUIgAAAAAAAAABQAAA'+
	'AAAAAAA+AAABQBAIBAAAAAAAAAABQAAAAB4iIiYaAAABQAAgIDwiIiI8AAABQAAAABwiICAeAAABQAACAh4iIiIeAAABQ'+
	'AAAABwiPiAeAAABQAAGCBwICAgIAAABQAAAAB4iIiIeAhwBQAAgIDwiIiIiAAABQAAIAAgICAgIAAABQAAIAAgICAgICD'+
	'ABQAAgICQoOCQiAAABQAAICAgICAgMAAABQAAAADwqKioqAAABQAAAACwyIiIiAAABQAAAABwiIiIcAAABQAAAADwiIiI'+
	'8ICABQAAAAB4iIiIeAgIBQAAAACwyICAgAAABQAAAAB4gHAI8AAABQAAICB4ICAgGAAABQAAAACIiIiYaAAABQAAAACIi'+
	'FBQIAAABQAAAACoqKioUAAABQAAAACIUCBQiAAABQAAAACIiIiIeAhwBQAAAAD4ECBA+AAABQAYICAgwCAgIBgABSAgIC'+
	'AgICAgICAgBQDAICAgGCAgIMAABQAAaLAAAAAAAAAABQAAAAAAAAAAqAAA'
}
export const COLORS=[
	0xFFFFFFFF,0xFFFFFF00,0xFFFF6500,0xFFDC0000,0xFFFF0097,0xFF360097,0xFF0000CA,0xFF0097FF,
	0xFF00A800,0xFF006500,0xFF653600,0xFF976536,0xFFB9B9B9,0xFF868686,0xFF454545,0xFF000000,
]
export const DEFAULT_COLORS=COLORS.slice(0)
export const BRUSHES=[
	0x00,0x00,0x00,0x10,0x00,0x00,0x00,0x00, 0x00,0x00,0x10,0x38,0x10,0x00,0x00,0x00,
	0x00,0x00,0x18,0x3C,0x3C,0x18,0x00,0x00, 0x00,0x38,0x7C,0x7C,0x7C,0x38,0x00,0x00,
	0x38,0x7C,0xFE,0xFE,0xFE,0x7C,0x38,0x00, 0x10,0x00,0x41,0x08,0x80,0x11,0x00,0x22,
	0x00,0x00,0x00,0x18,0x18,0x00,0x00,0x00, 0x00,0x00,0x38,0x38,0x38,0x00,0x00,0x00,
	0x00,0x00,0x3C,0x3C,0x3C,0x3C,0x00,0x00, 0x00,0x7C,0x7C,0x7C,0x7C,0x7C,0x00,0x00,
	0xFE,0xFE,0xFE,0xFE,0xFE,0xFE,0xFE,0x00, 0x20,0x0A,0x80,0x24,0x01,0x48,0x02,0x51,
	0x00,0x00,0x10,0x10,0x10,0x00,0x00,0x00, 0x10,0x10,0x10,0x10,0x10,0x10,0x10,0x00,
	0x10,0x00,0x10,0x00,0x10,0x00,0x10,0x00, 0x00,0x00,0x08,0x10,0x20,0x00,0x00,0x00,
	0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x00, 0x02,0x00,0x08,0x00,0x20,0x00,0x80,0x00,
	0x00,0x00,0x00,0x38,0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0xFE,0x00,0x00,0x00,0x00,
	0x00,0x00,0x00,0xAA,0x00,0x00,0x00,0x00, 0x00,0x00,0x20,0x10,0x08,0x00,0x00,0x00,
	0x80,0x40,0x20,0x10,0x08,0x04,0x02,0x00, 0x80,0x00,0x20,0x00,0x08,0x00,0x02,0x00,
]
export const ALIGN={left:0,center:1,right:2}
export const DEFAULT_ANIMS='[[13,9,5,1,5,9],[4,4,8,14,14,8],[18,18,20,19,19,20],[0,0,0,0,1,1,1,1]]'
export const DEFAULT_PATTERNS=
	'%%IMG0AAgA4AAAAAAAAAAA//////////+AgID/CAgI/yBAgMEiHAgQgAAIAIAACAD/d//d/3f/3XEiF49HInT4iFAgAgW'+
	'IiIiIACIAiAAiAHfdd9133XfdQIAACAQCACABAQOESDAMAogiiCKIIogiqlWqVapVqlWABEAIASACEMAMjbEwAxvYqgCq'+
	'AKoAqgD/Vf9V/1X/Vf8A/wD/AP8AqqqqqqqqqqpEiBEiRIgRIt27d+7du3fuQIABAgQIECC/f/79+/fv3wgAqgAIAIgAj'+
	'493mPj4d4mqAIgUIkGIALCwsL8Av7+w'

export const array_is      =x=>lii(x)&&x.n=='array'
export const image_is      =x=>lii(x)&&x.n=='image'
export const sound_is      =x=>lii(x)&&x.n=='sound'
export const font_is       =x=>lii(x)&&x.n=='font'
export const button_is     =x=>lii(x)&&x.n=='button'
export const field_is      =x=>lii(x)&&x.n=='field'
export const grid_is       =x=>lii(x)&&x.n=='grid'
export const slider_is     =x=>lii(x)&&x.n=='slider'
export const canvas_is     =x=>lii(x)&&x.n=='canvas'
export const contraption_is=x=>lii(x)&&x.n=='contraption'
export const proxy_is      =x=>lii(x)&&x.n=='proxy'
export const prototype_is  =x=>lii(x)&&x.n=='prototype'
export const deck_is       =x=>lii(x)&&x.n=='deck'
export const card_is       =x=>lii(x)&&x.n=='card'
export const patterns_is   =x=>lii(x)&&x.n=='patterns'
export const module_is     =x=>lii(x)&&x.n=='module'
export const widget_is     =x=>lii(x)&&({button:1,field:1,grid:1,slider:1,canvas:1,contraption:1,proxy:1})[x.n]
export const ikey  =(x,k)=>lis(x)&&x.v==k
export const ivalue=(x,k,d)=>x.hasOwnProperty(k)?x[k]:d
export const ifield=(x,k)  =>x.f(x,lms(k))
export const iindex=(x,k,v)=>x.f(x,lmn(k),v)
export const iwrite=(x,k,v)=>x.f(x,k,v)
export const value_inherit=(self,key)=>{
	let r=self[key];if(typeof r=='string')r=lms(r);if(typeof r=='number'||typeof r=='boolean')r=lmn(r);
	const card=self.card;if(!contraption_is(card))return r
	const p=dget(card.def.widgets,ifield(self,'name'));if(!p)return r
	const v=ifield(p,key);if(r&&v&&match(r,v))delete self[key];return r||v
}
export const init_field=(dst,key,src)=>{const k=lms(key),v=dget(src,k);if(v)iwrite(dst,k,v)}
export const normalize_enum=(x,v)=>x.hasOwnProperty(v)?v:Object.keys(x)[0]
export const normalize_font=(x,v)=>ls(dkey(x,v)||x.k[dkix(x,v)]||lms('body'))
export const data_enc=x=>x[5]==undefined?-1:+x[5]
export const data_read=(type,x)=>(x.slice(0,2)!='%%'||x.slice(2,5)!=type)?null:new Uint8Array(atob(x.slice(6)).split('').map(x=>x.charCodeAt(0)))
export const data_write=(type,x)=>`%%${type}${btoa(Array.from(x).map(x=>String.fromCharCode(x)).join(''))}`
export const is_rooted=x=>card_is(x)?!x.dead: widget_is(x)?(is_rooted(x.card)&&!x.dead): 1

export const ceil=Math.ceil, clamp=(a,x,b)=>x<a?a:x>b?b:x, sign=x=>x>0?1:-1
export const last=x=>x[x.length-1]
export const rect=(x,y,w,h)=>({x:x||0,y:y||0,w:w||0,h:h||0})
export const rpair=(a,b)=>rect(a.x,a.y,b.x,b.y)
export const rcopy=r=>rect(r.x,r.y,r.w,r.h)
export const rint=r=>rect(0|r.x,0|r.y,0|r.w,0|r.h)
export const radd=(a,b)=>rect(a.x+b.x,a.y+b.y,a.w+b.w,a.h+b.h)
export const rsub=(a,b)=>rect(a.x-b.x,a.y-b.y,a.w-b.w,a.h-b.h)
export const rmul=(a,n)=>rect(a.x*n,a.y*n,a.w*n,a.h*n)
export const rdiv=(a,n)=>rint(rmul(a,1/n))
export const inset=(r,n)=>rect(r.x+n,r.y+n,r.w-2*n,r.h-2*n)
export const rin=(r,p)=>p.x>=r.x&&p.y>=r.y&&p.x<r.x+r.w&&p.y<r.y+r.h           // point-in-rect
export const ron=(a,b)=>b.x+b.w>=a.x&&b.x<=a.x+a.w&&b.y+b.h>=a.y&&b.y<=a.y+a.h // rect-overlaps-rect
export const requ=(a,b)=>a.x==b.x&&a.y==b.y&&a.w==b.w&&a.h==b.h
export const rmax=(a,b)=>rect(max(a.x,b.x),max(a.y,b.y),max(a.w,b.w),max(a.h,b.h))
export const rmin=(a,b)=>rect(min(a.x,b.x),min(a.y,b.y),min(a.w,b.w),min(a.h,b.h))
export const rclip=(a,b)=>{const c=rmax(a,b);return rect(c.x,c.y,min(a.x+a.w,b.x+b.w)-c.x,min(a.y+a.h,b.y+b.h)-c.y)}
export const runion=(a,b)=>{const c=rmin(a,b);return rect(c.x,c.y,max(a.x+a.w,b.x+b.w)-c.x,max(a.y+a.h,b.y+b.h)-c.y)}
export const rcenter=(a,b)=>rint(rect(a.x+(a.w-b.x)/2,ceil(a.y+(a.h-b.y)/2.0),b.x,b.y))
export const rnorm=r=>{r=rcopy(r);if(r.w<0)r.w*=-1,r.x-=r.w;if(r.h<0)r.h*=-1,r.y-=r.h;return rint(r)}
export const rclamp=(a,b,c)=>rmin(rmax(a,b),c)
export const lmpair=r=>lml([lmn(r.x),lmn(r.y)])
export const lmrect=r=>lml([lmn(r.x),lmn(r.y),lmn(r.w),lmn(r.h)])
export const getpair=x=>(!x||!lil(x))?rect(): rect(x.v.length>0?ln(x.v[0]):0, x.v.length>1?ln(x.v[1]):0)
export const getrect=x=>(!x||!lil(x))?rect(): rect(x.v.length>0?ln(x.v[0]):0, x.v.length>1?ln(x.v[1]):0, x.v.length>2?ln(x.v[2]):0, x.v.length>3?ln(x.v[3]):0)
export const getimage=x=>(!x||!image_is(x))? image_make(rect()): x
export const ukey=(dict,name,root,original)=>{
	if(original&&match(name,original))return name
	if(name&&lis(name)&&!dget(dict,name))return name
	let i=1;while(1){let n=lms(root+(i++));if(!dget(dict,n))return n}
}
export const uset=(dict,name,root,x)=>(dset(dict,ukey(dict,name,root),x),x)
export const reorder=(dict,a,b)=>{
	b=clamp(0,b,count(dict)-1);const k=dict.k[a],v=dict.v[a]
	if(b<a){for(let z=a;z>b;z--)dict.k[z]=dict.k[z-1],dict.v[z]=dict.v[z-1]}
	else   {for(let z=a;z<b;z++)dict.k[z]=dict.k[z+1],dict.v[z]=dict.v[z+1]}
	dict.k[b]=k,dict.v[b]=v
}
export const anchors={top_left:0,top_center:1,top_right:2,center_left:3,center:4,center_right:5,bottom_left:6,bottom_center:7,bottom_right:8}
export const anchor=(r,a)=>{
	if(a==undefined)return rint(r);a=anchors[ls(a)]||0
	if(a==1||a==4||a==7)r.x-=r.w/2; if(a==2||a==5||a==8)r.x-=r.w
	if(a==3||a==4||a==5)r.y-=r.h/2; if(a==6||a==7||a==8)r.y-=r.h
	return rint(r)
}
export const unpack_rect=(z,size)=>{
	let s=size||frame.image.size, v=rect(0,0,s.x,s.y)
	if(z.length>=1){const a=rint(getpair(z[0])),b=rint(getpair(z[1]));if(b.x<0)a.x+=1+b.x,b.x*=-1;if(b.y<0)a.y+=1+b.y,b.y*=-1;v=rpair(a,b)}
	return anchor(v,z[2])
}
export const unpack_poly=z=>{
	const r=[];z.map(x=>{if(lil(x)&&x.v.every(x=>!lin(x))){ll(x).map(x=>r.push(getpair(x)))}else{r.push(getpair(x))}})
	if(r.length==1)r.push(r[0]);return r
}
export const readcolor=(cr,cg,cb,grayscale)=>{
	if(grayscale){
		// perceptually weighted gray: http://entropymine.com/imageworsener/grayscale/
		const rf=0.2126*Math.pow(cr,2.2), gf=0.7152*Math.pow(cg,2.2), bf=0.0722*Math.pow(cb,2.2), gg=Math.pow(rf+gf+bf,1/2.2)
		return clamp(0,0|gg,255)
	}
	let ci=0,cd=1e20;for(let c=0;c<16;c++){
		const dr=abs(((COLORS[c]>>16)&0xFF)/256.0-cr/256.0),
			  dg=abs(((COLORS[c]>> 8)&0xFF)/256.0-cg/256.0),
			  db=abs(((COLORS[c]    )&0xFF)/256.0-cb/256.0),
			  diff=(dr*dr)+(dg*dg)+(db*db)
		if(diff<cd)ci=c,cd=diff
	}if(ci==15)return 1;return ci+32
}

let audio_playing=0
export const interface_app=lmi((self,i,x)=>{
	if(x&&lis(i)){
		if(i.v=='fullscreen')return set_fullscreen(lb(x)),x
	}else if(lis(i)){
		if(i.v=='fullscreen')return lmn(is_fullscreen())
		if(i.v=='playing'   )return lmn(audio_playing)
		if(i.v=='save'      )return lmnat(_=>((modal_enter&&modal_enter('save_deck'),NONE)))
		if(i.v=='exit'      )return lmnat(_=>NONE) // does nothing in web-decker
		if(i.v=='show')return lmnat(z=>{
			const sp=x=>lis(x)?ls(x): lin(x)?ln(x): show(x)
			if(lit(z[0])){console.table(rows(z[0]).v.map(r=>r.k.reduce((a,k,i)=>{a[ls(k)]=sp(r.v[i]);return a},{})))}
			else{console.log(z.map(x=>show(x,z.length==1)).join(' '))}
			return z[0]||NONE
		})
		if(i.v=='print')return lmnat(z=>{
			const r=ls(z.length>1?dyad.format(z[0],lml(z.slice(1))):z[0]||NONE);console.log(r)
			return lms(r)
		})
		if(i.v=='render')return draw_con==undefined?NONE:lmnat(([a])=>{
			return widget_is(a)?draw_widget(a): card_is(a)?draw_con(a,1): image_make(rect())
		})
	}return x?x:NONE
},'app')

export const interface_bits=lmi((self,i,x)=>{
	const lbits=x=>0xFFFFFFFF&ln(x), cb=f=>lmnat(a=>(a.length<2?ll(a[0]||NONE):a).reduce(vd(f)))
	if(ikey(i,'and'))return cb((x,y)=>lmn((lbits(x)&lbits(y))>>>0))
	if(ikey(i,'or' ))return cb((x,y)=>lmn((lbits(x)|lbits(y))>>>0))
	if(ikey(i,'xor'))return cb((x,y)=>lmn((lbits(x)^lbits(y))>>>0))
	return x?x:NONE
},'bits')

let frame=null
export const inclip=p=>rin(frame.clip,p)
export const gpix=p=>frame.image.pix[p.x+p.y*frame.image.size.x]
export const pix=(p,v)=>frame.image.pix[p.x+p.y*frame.image.size.x]=v
export const pal_pat=(pal,p,x,y)=>pal[(x%8)+(8*(y%8))+(8*8*p)]
export const draw_pattern=(pal,pix,pos)=>pix<2?(pix?1:0): pix>31?(pix==32?0:1): pal_pat(pal,pix,pos.x,pos.y)&1
export const draw_hline=(x0,x1,y,pattern)=>{
	if(y<frame.clip.y||y>=frame.clip.y+frame.clip.h)return
	x0=max(frame.clip.x,x0),x1=min(frame.clip.x+frame.clip.w,x1);for(let z=x0;z<x1;z++)pix(rect(z,y),pattern)
}
export const draw_vline=(x,y0,y1,pattern)=>{
	if(x<frame.clip.x||x>=frame.clip.x+frame.clip.w)return
	y0=max(frame.clip.y,y0),y1=min(frame.clip.y+frame.clip.h,y1);for(let z=y0;z<y1;z++)pix(rect(x,z),pattern)
}
export const draw_rect=(r,pattern)=>{r=rclip(r,frame.clip);for(let a=r.y;a<r.y+r.h;a++)for(let b=r.x;b<r.x+r.w;b++)pix(rect(b,a),pattern)}
export const draw_invert_raw=(pal,r)=>{r=rclip(r,frame.clip);for(let a=r.y;a<r.y+r.h;a++)for(let b=r.x;b<r.x+r.w;b++){const h=rect(b,a);pix(h,1^draw_pattern(pal,gpix(h),h))}}
export const draw_icon=(p,i,pattern)=>{const s=i.size;for(let a=0;a<s.y;a++)for(let b=0;b<s.x;b++){const h=rect(p.x+b,p.y+a);if(i.pix[b+(a*s.x)]&&inclip(h))pix(h,pattern)}}
export const draw_iconc=(r,i,pattern)=>draw_icon(rcenter(r,i.size),i,pattern)

export const draw_line_simple=(r,brush,pattern)=>{
	r=rint(r);const bsh=(z,x,y)=>(BRUSHES[(z*8)+y]>>(7-x))&1
	let dx=abs(r.w-r.x), dy=-abs(r.h-r.y), err=dx+dy, sx=r.x<r.w ?1:-1, sy=r.y<r.h?1:-1;while(1){
		if(brush==0){if(inclip(r))pix(r,pattern)}
		else{for(let b=0;b<8;b++)for(let a=0;a<8;a++){const h=rect(r.x+a-3,r.y+b-3);if(bsh(brush,a,b)&&inclip(h))pix(h,pattern)}}
		if(r.x==r.w&&r.y==r.h)break;let e2=err*2; if(e2>=dy)err+=dy,r.x+=sx; if(e2<=dx)err+=dx,r.y+=sy
	}
}
export const draw_line_custom=(r,mask,pattern)=>{
	let dx=abs(r.w-r.x), dy=-abs(r.h-r.y), err=dx+dy, sx=r.x<r.w ?1:-1, sy=r.y<r.h?1:-1, ms=mask.size, mc=rint(rdiv(ms,2));while(1){
		for(let b=0;b<ms.y;b++)for(let a=0;a<ms.x;a++){const h=rect(r.x+a-mc.x,r.y+b-mc.y);if(mask.pix[a+b*ms.x]&&inclip(h))pix(h,pattern)}
		if(r.x==r.w&&r.y==r.h)break;let e2=err*2; if(e2>=dy)err+=dy,r.x+=sx; if(e2<=dx)err+=dx,r.y+=sy
	}
}
export const draw_line_function=(r,func,pattern)=>{
	const a=lml([lmpair(rect(r.w-r.x,r.h-r.y)),ONE]),p=lmblk(),e=lmenv();blk_lit(p,func),blk_lit(p,a),blk_op(p,op.CALL),pushstate(e)
	let dx=abs(r.w-r.x), dy=-abs(r.h-r.y), err=dx+dy, sx=r.x<r.w ?1:-1, sy=r.y<r.h?1:-1;while(!do_panic){
		state.e=[e],state.t=[],state.pcs=[];issue(e,p);let quota=BRUSH_QUOTA;while(quota&&running())runop(),quota--;const v=running()?NONE:arg()
		if(image_is(v)){
			const ms=v.size, mc=rint(rdiv(ms,2))
			for(let b=0;b<ms.y;b++)for(let a=0;a<ms.x;a++){const h=rect(r.x+a-mc.x,r.y+b-mc.y);if(v.pix[a+b*ms.x]&&inclip(h))pix(h,pattern)}
		}if(r.x==r.w&&r.y==r.h)break;let e2=err*2; if(e2>=dy)err+=dy,r.x+=sx; if(e2<=dx)err+=dx,r.y+=sy; a.v[1]=NONE
	}popstate()
}
export const draw_line=(r,brush,pattern,deck)=>{
	if(brush>=0&&brush<=23){draw_line_simple(r,brush,pattern);return}
	const b=deck.brushes;if(brush<0||brush-24>=b.v.length)return;const f=b.v[brush-24]
	if(image_is(f)){draw_line_custom(r,f,pattern)}else if(lion(f)){draw_line_function(r,f,pattern)}
}
export const n_brush=(z,deck)=>{
	const b=deck.brushes,bt=deck.brusht,f=z[0],s=z[1]
	if(lion(f)){
		const k=lms(f.n),v=image_make(rect(64,32)),t=frame; dset(b,k,f),frame=({size:v.size,clip:rect(0,0,64,32),image:v})
		draw_line(rect(16,16,32,16),24+dkix(b,k),1,deck)
		draw_line(rect(32,16,40,16),24+dkix(b,k),1,deck)
		draw_line(rect(40,16,44,16),24+dkix(b,k),1,deck)
		draw_line(rect(44,16,48,16),24+dkix(b,k),1,deck)
		frame=t,dset(bt,lms(f.n),v)
	}
	if(lis(f)&&s&&image_is(s))dset(b,f,s),dset(bt,f,s)
	return b
}

export const draw_box=(r,brush,pattern)=>{
	const size=frame.image.size
	if(r.w==0||r.h==0||!ron(r,rect(0,0,size.x,size.y)))return
	if(r.y         >=0)draw_line_simple(rect(r.x      ,r.y      ,r.x+r.w-1,r.y      ),brush,pattern)
	if(r.y+r.h<=size.y)draw_line_simple(rect(r.x      ,r.y+r.h-1,r.x+r.w-1,r.y+r.h-1),brush,pattern)
	if(r.x         >=0)draw_line_simple(rect(r.x      ,r.y      ,r.x      ,r.y+r.h-1),brush,pattern)
	if(r.x+r.w<=size.x)draw_line_simple(rect(r.x+r.w-1,r.y      ,r.x+r.w-1,r.y+r.h-1),brush,pattern)
}
export const draw_boxf=(r,brush,pattern,deck)=>{
	const size=frame.image.size
	if(r.w==0||r.h==0||!ron(r,rect(0,0,size.x,size.y)))return
	if(r.y         >=0)draw_line(rect(r.x      ,r.y      ,r.x+r.w-1,r.y      ),brush,pattern,deck)
	if(r.y+r.h<=size.y)draw_line(rect(r.x      ,r.y+r.h-1,r.x+r.w-1,r.y+r.h-1),brush,pattern,deck)
	if(r.x         >=0)draw_line(rect(r.x      ,r.y      ,r.x      ,r.y+r.h-1),brush,pattern,deck)
	if(r.x+r.w<=size.x)draw_line(rect(r.x+r.w-1,r.y      ,r.x+r.w-1,r.y+r.h-1),brush,pattern,deck)
}
export const draw_lines=(poly,brush,pattern,deck)=>{for(let z=0;z<poly.length-1;z++)draw_line(rpair(poly[z],poly[z+1]),brush,pattern,deck)}
export const poly_bounds=poly=>{
	const d=rect(frame.clip.x+frame.clip.w,frame.clip.y+frame.clip.h,frame.clip.x,frame.clip.y)
	for(let z=0;z<poly.length;z++){const p=poly[z];d.x=min(d.x,p.x),d.y=min(d.y,p.y),d.w=max(d.w,p.x),d.h=max(d.h,p.y)}
	d.w-=d.x,d.h-=d.y,d.w++,d.h++;return d
}
export const poly_in=(poly,pos)=>{
	let r=0;for(let i=0,j=poly.length-1;i<poly.length;i++){
		if(pos.x==poly[i].x&&pos.y==poly[i].y)return 1
		if(((poly[i].y>=pos.y)!=(poly[j].y>=pos.y))&&(pos.x<=(poly[j].x-poly[i].x)*(pos.y-poly[i].y)/(poly[j].y-poly[i].y)+poly[i].x))r^=1
		j=i
	}return r
}
export const draw_poly=(poly,pattern)=>{
	const r=rint(rclip(frame.clip,poly_bounds(poly)))
	for(let a=0;a<=r.h;a++)for(let b=0;b<=r.w;b++){const h=rect(b+r.x,a+r.y);if(poly_in(poly,h))pix(h,pattern)}
}
export const draw_fill=(r,pattern,ref)=>{
	if(!inclip(r))return
	const src=ref||frame.image, visited=new Uint8Array(src.size.x*src.size.y)
	const spix=p=>src.pix[p.x+p.y*src.size.x], source=spix(r), fringe=[r]
	const OFFSETS=[rect(-1,0),rect(0,-1),rect(1,0),rect(0,1)], stride=frame.image.size.x
	while(fringe.length){
		const here=fringe.pop();if(gpix(here)==pattern)continue;pix(here,pattern)
		for(let z=0;z<4;z++){
			const there=radd(here,OFFSETS[z]),ti=there.x+there.y*stride
			if(inclip(there)&&!visited[ti]&&spix(there)==source)fringe.push(there),visited[ti]=1
		}
	}
}
export const draw_char=(pos,font,c,pattern)=>{
	const iw=font_w(font),ih=font_h(font);
	for(let a=0;a<ih;a++)for(let b=0;b<iw;b++)if(font_gpix(font,c,b,a)){
		const h=rect(pos.x+b,pos.y+a);if(inclip(h))pix(h,pattern)
	}
}
export const draw_text=(pos,text,font,pattern)=>{
	const cursor=rect(pos.x,pos.y);for(let z=0;z<text.length;z++){
		const c=text[z];
		if(c!='\n'){draw_char(cursor,font,c,pattern),cursor.x+=font_gw(font,c)+font_sw(font)}
		else{cursor.x=pos.x,cursor.y+=font_h(font)}
	}
}
export const layout_plaintext=(text,font,align,mx)=>{
	let layout=[],lines=[],cursor=rect(0,0), lnl=_=>(cursor.x=0,cursor.y+=1), ws=x=>x=='\n'||x==' '
	const fh=font_h(font),fs=font_sw(font)
	for(let z=0;z<text.length;z++){
		let a=z,w=text[z]=='\n'?0:(font_gw(font,text[z])+fs)
		if(!ws(text[z]))while(text[z+1]&&!ws(text[z+1]))w+=font_gw(font,text[++z])+fs // find word
		if(cursor.x+w>=mx.x&&cursor.x>0)lnl() // word won't fit this line
		for(let i=a;i<=z;i++){                 // append word to line
			const c=text[i], size=rect(c=='\n'?0:font_gw(font,c)+fs,fh)
			if(c==' '&&cursor.x==0&&layout.length>0&&!ws(last(layout).char))size.x=0 // squish lead space after a soft-wrap
			if(cursor.x+size.x>=mx.x)lnl() // hard-break overlong words
			layout.push({pos:rpair(cursor,size),line:cursor.y,char:c,font,arg:NONE})
			if(c=='\n'){lnl()}else{cursor.x+=size.x}
			if(cursor.y>=(mx.y/fh)){
				layout=layout.slice(0,max(1,layout.length-3))
				layout[layout.length-1].c=ELLIPSIS,layout[layout.length-1].pos.w=font_gw(font,ELLIPSIS)+fs
				z=text.length-1;break
			}
		}
	}
	let y=0;for(let i=0,line=0;i<layout.length;i++,line++){
		let a=i;while(i<(layout.length-1)&&(layout[i+1].pos.y==line))i++          // find bounds of line
		let h=0;for(let z=a;z<=i;z++)h=max(h,layout[z].pos.h)                     // find height of line
		let w=(a&&a==i)?0:(layout[i].pos.x+layout[i].pos.w)                       // find width of line
		let x=align==ALIGN.center?0|((mx.x-w)/2): align==ALIGN.right?(mx.x-w): 0  // justify
		lines.push({pos:rect(x,y,w,h),range:rect(a,i)})
		for(let z=a;z<=i;z++){const g=layout[z].pos;g.y=y+0|((h-g.h)/2);g.x+=x;}if(i<layout.length-1)y+=h
	}return {size:rect(mx.x,y+fh),layout,lines}
}
export const layout_richtext=(deck,table,font,align,width)=>{
	const layout=[],lines=[],cursor=rect(0,0), lnl=_=>(cursor.x=0,cursor.y+=1), ws=x=>x=='\n'||x==' '
	const texts=tab_get(table,'text'), fonts=tab_get(table,'font'), args=tab_get(table,'arg')
	for(let chunk=0;chunk<texts.length;chunk++){
		const f=dget(deck.fonts,fonts[chunk])||font, fh=font_h(f), fs=font_sw(f)
		if(image_is(args[chunk])){
			const size=args[chunk].size;if(cursor.x+size.x>=width&&cursor.x>0)lnl()
			layout.push({pos:rpair(cursor,size),line:cursor.y,char:'i',font:f,arg:args[chunk]})
			cursor.x+=size.x;continue
		}
		const t=ls(texts[chunk]);for(let z=0;z<t.length;z++){
			let a=z, w=t[z]=='\n'?0:(font_gw(f,t[z])+fs)
			if(!ws(t[z]))while(z+1<t.length&&!ws(t[z+1]))w+=font_gw(f,t[++z])+fs
			if(cursor.x+w>=width&&cursor.x>0)lnl()
			for(let i=a;i<=z;i++){
				const c=t[i], size=rect(c=='\n'?0:font_gw(f,c)+fs,fh)
				if(c==' '&&cursor.x==0&&layout.length>0&&!ws(last(layout).char))size.x=0
				if(cursor.x+size.x>=width)lnl()
				layout.push({pos:rpair(cursor,size),line:cursor.y,char:c,font:f,arg:args[chunk]})
				if(c=='\n'){lnl()}else{cursor.x+=size.x}
			}
		}
	}
	let y=0;for(let i=0,line=0;i<layout.length;i++,line++){
		let a=i;while(i<(layout.length-1)&&(layout[i+1].pos.y==line))i++            // find bounds of line
		let h=0;for(let z=a;z<=i;z++)h=max(h,layout[z].pos.h)                       // find height of line
		let w=(a&&a==i)?0:(layout[i].pos.x+layout[i].pos.w)                         // find width of line
		let x=align==ALIGN.center?0|((width-w)/2): align==ALIGN.right?(width-w): 0  // justify
		lines.push({pos:rect(x,y,w,h),range:rect(a,i)})
		for(let z=a;z<=i;z++){const g=layout[z].pos;g.y=y+0|((h-g.h)/2);g.x+=x;}y+=h
	}return {size:rect(width,y),layout,lines}
}
export const draw_text_wrap=(r,l,pattern)=>{
	r=rint(r);const oc=frame.clip;frame.clip=r;for(let z=0;z<l.layout.length;z++){
		const g=l.layout[z];if(g.pos.w<1)continue
		draw_char(radd(g.pos,r),g.font,g.char,pattern)
	}frame.clip=oc;
}
export const draw_text_rich=(r,l,pattern,opaque)=>{
	const oc=frame.clip;frame.clip=r;for(let z=0;z<l.layout.length;z++){
		const g=l.layout[z];if(g.pos.w<1)continue
		if(g.pos.y+g.pos.h<0||g.pos.y>r.h)continue; g.pos.x+=r.x, g.pos.y+=r.y
		if(lis(g.arg)&&count(g.arg))draw_hline(g.pos.x,g.pos.x+g.pos.w,g.pos.y+g.pos.h-1,19)
		if(image_is(g.arg)){image_paste(g.pos,frame.clip,g.arg,frame.image,opaque)}
		else{draw_char(g.pos,g.font,g.char,pattern)}
	}frame.clip=oc
}
export const draw_9seg=(r,dst,src,m,clip,opaque,pal)=>{
	const o=rect(r.x,r.y), s=src.size, ss=s, ds=dst.size; if(s.x<1||s.y<1)return
	const draw_wrapped=(o,sr)=>{
		const r=rclip(o,clip),d=rsub(r,o);sr=rclip(sr,rpair(rect(0,0),ss));if(r.w<=0||r.h<=0||sr.w<=0||sr.h<=0)return
		if(!pal){ // solid/opaque
			for(let y=0;y<r.h;y++)for(let x=0;x<r.w;x++){const c=src.pix[(sr.x+((x+d.x)%sr.w))+(sr.y+((y+d.y)%sr.h))*ss.x];if(opaque||c)dst.pix[(r.x+x)+(r.y+y)*ds.x]=c}
		}
		else{ // invert
			const draw_pattern=(pix,x,y)=>pix<2?(pix?1:0): pix>31?(pix==32?0:1): pal_pat(pal,pix,x,y)&1
			for(let y=0;y<r.h;y++)for(let x=0;x<r.w;x++){
				let dx=r.x+x,dy=r.y+y, c=draw_pattern(src.pix[(sr.x+((x+d.x)%sr.w))+(sr.y+((y+d.y)%sr.h))*ss.x],dx,dy), di=(r.x+x)+(r.y+y)*ds.x
				dst.pix[di]=c^draw_pattern(dst.pix[di],dx,dy)
			}
		}
	}
	draw_wrapped(radd(rect(0      ,0      ,m.x          ,m.y          ),o),rect(0      ,0      ,m.x          ,m.y          )) // NW
	draw_wrapped(radd(rect(0      ,r.h-m.h,m.x          ,m.h          ),o),rect(0      ,s.y-m.h,m.x          ,m.h          )) // SW
	draw_wrapped(radd(rect(r.w-m.w,0      ,m.w          ,m.y          ),o),rect(s.x-m.w,0      ,m.w          ,m.y          )) // NE
	draw_wrapped(radd(rect(r.w-m.w,r.h-m.h,m.w          ,m.h          ),o),rect(s.x-m.w,s.y-m.h,m.w          ,m.h          )) // SE
	draw_wrapped(radd(rect(0      ,m.y    ,m.x          ,r.h-(m.y+m.h)),o),rect(0      ,m.y    ,m.x          ,s.y-(m.y+m.h))) // W
	draw_wrapped(radd(rect(m.x    ,0      ,r.w-(m.x+m.w),m.y          ),o),rect(m.x    ,0      ,s.x-(m.x+m.w),m.y          )) // N
	draw_wrapped(radd(rect(r.w-m.w,m.y    ,m.w          ,r.h-(m.y+m.h)),o),rect(s.x-m.w,m.y    ,m.w          ,s.y-(m.y+m.h))) // E
	draw_wrapped(radd(rect(m.x    ,r.h-m.h,r.w-(m.x+m.w),m.h          ),o),rect(m.x    ,s.y-m.h,s.x-(m.x+m.w),m.h          )) // S
	draw_wrapped(radd(rect(m.x    ,m.y    ,r.w-(m.x+m.w),r.h-(m.y+m.h)),o),rect(m.x    ,m.y    ,s.x-(m.x+m.w),s.y-(m.y+m.h))) // C
}

export const pointer={f:(self,i,x)=>{
	if(ikey(i,'held' ))return lmn(self.held)
	if(ikey(i,'down' ))return lmn(self.down)
	if(ikey(i,'up'   ))return lmn(self.up)
	if(ikey(i,'pos'  ))return lmpair(self.pos)
	if(ikey(i,'start'))return lmpair(self.start)
	if(ikey(i,'prev' ))return lmpair(self.prev)
	if(ikey(i,'end'  ))return lmpair(self.end)
	return x?x:NONE
},t:'int',n:'pointer',held:0,down:0,up:0,pos:rect(),start:rect(),prev:rect(),end:rect()}

export const keystore_read=x=>{
	let store=lmd();if(x)x.k.filter((k,i)=>!match(NONE,x.v[i])).map((k,i)=>dset(store,k,x.v[i]))
	return {f:(self,i,x)=>{
		i=ls(i);if(i=='keys')return monad.keys(self.data)
		if(x){
			const f=lms('%j'),val=dyad.parse(f,dyad.format(f,x))
			if(match(NONE,val)){self.data=dyad.drop(lms(i),self.data)}else{dset(self.data,lms(i),val)}
			return x
		}else{return dget(self.data,lms(i))||NONE}
	},t:'int',n:'keystore',data:store}
}

export const module_read=(x,deck)=>{
	const ri=lmi((self,i,x)=>{
		if(x){
			if(ikey(i,'description'))return self.description=ls(x),x
			if(ikey(i,'version'))return self.version=ln(x),x
			if(ikey(i,'name')){
				if(ls(x)=='')return x
				self.name=ls(ukey(self.deck.modules,lms(ls(x)),ls(x),lms(self.name)))
				self.deck.modules.k[dvix(self.deck.modules,self)]=self.name
				return x
			}
			if(ikey(i,'script')){
				self.script=ls(x),self.error='',self.value=lmd();try{
					const prog=parse(self.script),root=lmenv();primitives(root,deck),constants(root),root.local('data',self.data)
					pushstate(root),issue(root,prog);let q=MODULE_QUOTA;while(running()&&q>0)runop(),q--
					if(running()){self.error='initialization took too long.'}
					else{self.value=ld(arg())};popstate()
				}catch(e){self.error=e.x;return x}
			}
		}else{
			if(ikey(i,'name'       ))return lms(self.name)
			if(ikey(i,'data'       ))return self.data
			if(ikey(i,'description'))return lms(self.description||'')
			if(ikey(i,'version'    ))return lmn(self.version||0.0)
			if(ikey(i,'script'     ))return lms(self.script||'')
			if(ikey(i,'error'      ))return lms(self.error||'')
			if(ikey(i,'value'      ))return self.value
		}return x?x:NONE
	},'module')
	const n=dget(x,lms('name'))
	ri.deck=deck
	ri.name=ls(ukey(deck.modules,n&&lis(n)&&count(n)==0?null:n,'module'))
	ri.data=keystore_read(dget(x,lms('data')))
	ri.value=lmd()
	init_field(ri,'description',x)
	init_field(ri,'version',x)
	init_field(ri,'script',x)
	return ri
}
export const module_write=x=>{
	const r=lmd()
	dset(r,lms('name'  ),ifield(x,'name'))
	dset(r,lms('data'  ),x.data.data)
	dset(r,lms('script'),ifield(x,'script'))
	if(x.description)dset(r,lms('description'),ifield(x,'description'))
	if(x.version)dset(r,lms('version'),ifield(x,'version'))
	return r
}

const casts={u8:1,i8:1,u16b:2,u16l:2,i16b:2,i16l:2,u32b:4,u32l:4,i32b:4,i32l:4,char:1}
export const array_write=x=>data_write('DAT'+String.fromCharCode(48+Object.keys(casts).indexOf(x.cast)),x.data.slice(x.base,x.base+x.size))
export const array_read=x=>{const f=x.charCodeAt(5),d=data_read('DAT',x);return d?array_make(d.length,Object.keys(casts)[clamp(0,f-48,10)],0,d):array_make(0,'u8',0)}
export const n_array=([x,y])=>{if(lis(x))return array_read(ls(x));const size=ln(x),cast=y?normalize_enum(casts,ls(y)):'u8';return array_make(size,cast,0)}
export const array_make=(size,cast,base,buffer)=>{
	const offset=x=>({offset:ln(lil(x)?monad.first(x):x),len:lil(x)?max(0,ln(monad.last(x))):-1})
	const shift=(a,here)=>({here:0, size:a.size-here, base:a.base+here, cast:a.cast, data:a.data})
	const resize=(a,size)=>{
		if(a.slice)return;size=max(0,size);const old=a.data;a.data=new Uint8Array(size)
		for(let z=0;z<a.data.length;z++)a.data[z]=z>=old.length?0:old[z];a.size=size
	}
	const get_raw=(a,index)=>{
		const step=casts[a.cast];if(index<0||index>=(0|(a.size/step)))return 0
		const ix=a.base+step*index;if(ix<0||ix+step>a.data.length)return 0
		const ur=(i,s)=>a.data[ix+i]<<s
		const s8 =x=>x<<24>>24
		const s16=x=>x<<16>>16
		const u32=(a,b,c,d)=>(2*a)+(b|c|d)
		if(a.cast=='u8'  )return     ur(0,0)
		if(a.cast=='i8'  )return  s8(ur(0,0))
		if(a.cast=='u16b')return    (ur(0,8)|ur(1,0))
		if(a.cast=='u16l')return    (ur(1,8)|ur(0,0))
		if(a.cast=='i16b')return s16(ur(0,8)|ur(1,0))
		if(a.cast=='i16l')return s16(ur(1,8)|ur(0,0))
		if(a.cast=='u32b')return u32(ur(0,23),ur(1,16),ur(2,8),ur(3,0))
		if(a.cast=='u32l')return u32(ur(3,23),ur(2,16),ur(1,8),ur(0,0))
		if(a.cast=='i32b')return    (ur(0,24)|ur(1,16)|ur(2,8)|ur(3,0))
		if(a.cast=='i32l')return    (ur(3,24)|ur(2,16)|ur(1,8)|ur(0,0))
		return String.fromCharCode(ur(0,0))
	}
	const set_raw=(a,index,v)=>{
		if('string'==typeof v)v=v.charCodeAt(0)
		const step=casts[a.cast];if(index<0||index>=(0|(a.size/step)))return
		const ix=a.base+step*index;if(ix<0||ix+step>a.data.length)return
		const uw=(i,s)=>a.data[ix+i]=v>>>s
		if     (a.cast=='u16b'||a.cast=='i16b')uw(0,8),uw(1,0)
		else if(a.cast=='u16l'||a.cast=='i16l')uw(1,8),uw(0,0)
		else if(a.cast=='u32b'||a.cast=='i32b')uw(0,24),uw(1,16),uw(2,8),uw(3,0)
		else if(a.cast=='u32l'||a.cast=='i32l')uw(3,24),uw(2,16),uw(1,8),uw(0,0)
		else uw(0,0)
	}
	const get=(a,index,len)=>{
		if(a.cast=='char'&&len<0)len=1
		if(a.cast=='char'){
			const t=a.cast;a.cast='u8';
			const r=(new TextDecoder('utf-8')).decode(new Uint8Array(range(len).map(x=>get_raw(a,index+x))))
			return a.cast=t,lms(clchars(r))
		}
		return len<0?lmn(get_raw(a,index)): lml(range(len).map(x=>lmn(get_raw(a,index+x))))
	}
	const set=(a,index,len,v)=>{
		if(len<0)len=1
		if(array_is(v)){for(let z=0;z<len;z++)set_raw(a,index+z,get_raw(v,z))}             // array copy
		else if(lis(v)){for(let z=0;z<len;z++)set_raw(a,index+z,z>=count(v)?0:v.v[z])}     // copy chars up to len
		else if(lil(v)){for(let z=0;z<len;z++)set_raw(a,index+z,z>=count(v)?0:ln(v.v[z]))} // copy numbers up to len
		else{const vv=ln(v);for(let z=0;z<len;z++)set_raw(a,index+z,vv)}                   // spread a number up to len
	}
	const slice=(a,z)=>{
		const o=offset(z[0]||NONE),cast=z[1]?normalize_enum(casts,ls(z[1])):a.cast, step=casts[cast];o.offset*=casts[a.cast]
		if(o.len<0)o.len=0|((a.size-o.offset)/step);const r=array_make(o.len,cast,o.offset,a.data);r.slice=1;return r
	}
	const copy=(a,z)=>{
		const o=offset(z[0]||NONE),cast=z[1]?normalize_enum(casts,ls(z[1])):a.cast, step=casts[cast];o.offset*=casts[a.cast]
		if(o.len<0)o.len=0|((src.size-o.offset)/step);const r=array_make(o.len,cast,0)
		for(let z=0;z<o.len;z++)set_raw(r,z,get_raw(shift(a,o.offset),z));return r
	}
	const struct_size=shape=>{
		if( lis(shape))return (casts[ls(shape)]||1)
		if( lil(shape))return (casts[ls(monad.first(shape))]||1)*max(0,ln(monad.last(shape)))
		if(!lid(shape))return 0
		let bit=0, r=0;shape.v.map(type=>{
			if(!lin(type)&&bit)bit=0,r++
			if(lin(type)){bit+=clamp(1,ln(type),31),r+=0|(bit/8),bit%=8}else{r+=struct_size(type)}
		});return r
	}
	const struct_read=(a,shape)=>{
		if(lis(shape)){a.cast=normalize_enum(casts,ls(shape));const r=get(shift(a,a.here),0,-1);a.here+=casts[a.cast];return r}
		if(lil(shape)){
			const n=max(0,ln(monad.last(shape)))
			a.cast=normalize_enum(casts,ls(monad.first(shape)));const r=get(shift(a,a.here),0,n);a.here+=n*casts[a.cast];return r
		}
		if(!lid(shape))return NONE;let bit=0,r=lmd();shape.v.map((type,i)=>{
			let v=NONE;if(!lin(type)&&bit)bit=0,a.here++
			if(lin(type)){
				let n=clamp(1,ln(type),31),t=0;a.cast='u8'
				while(n>0){t=(t<<1)|(1&(get_raw(a,a.here)>>(7-bit))),bit++,n--;if(bit==8)bit=0,a.here++}v=lmn(t)
			}else{v=struct_read(a,type)}dset(r,shape.k[i],v)
		});return r
	}
	const struct_write=(a,shape,value)=>{
		if(lis(shape)||lil(shape)){
			let n=lis(shape)?1:max(0,ln(monad.last(shape)));a.cast=normalize_enum(casts,ls(lis(shape)?shape:monad.first(shape)))
			set(shift(a,a.here),0,n,value),a.here+=n*casts[a.cast];return
		}if(!lid(shape))return
		let bit=0;shape.v.map((type,i)=>{
			let v=dget(value,shape.k[i])||NONE
			if(!lin(type)){if(bit)bit=0,a.here++;struct_write(a,type,v);return}
			let n=clamp(1,ln(type),31), t=ln(v),m=(1<<n)-1;t&=m,a.cast='u8';for(let z=0;z<n;z++){
				let pos=1<<(7-bit),dst=get_raw(a,a.here)&~pos
				set_raw(a,a.here,t&(1<<(n-1-z))?dst|pos:dst),bit++;if(bit==8)bit=0,a.here++
			}
		})
	}
	const struct=(a,z)=>{
		const oc=a.cast, shape=z[0]||NONE, value=z[1], size=struct_size(shape);if(value&&a.here+size>=a.size)resize(a,a.here+size)
		const r=value?(struct_write(a,shape,value),value):struct_read(a,shape);return a.cast=oc,r
	}
	const cat=(a,z)=>{
		return z.map(v=>{
			const s=lin(v)?lms(a.cast): lil(v)?lml([lms(a.cast),monad.count(v)]):
			      array_is(v)?lml([ifield(v,'cast'),ifield(v,'size')]): (v=lms(ls(v)),lml([lms('char'),monad.count(v)]))
			struct(a,[s,v])
		}),a
	}
	const ri=lmi((self,i,x)=>{
		if(!lis(i)){const o=offset(i);if(x){set(self,o.offset,o.len,x);return x;}else{return get(self,o.offset,o.len);}}
		if(x){
			if(ikey(i,'size'))return resize(self,ln(x)*casts[self.cast]),x
			if(ikey(i,'cast'))return self.cast=normalize_enum(casts,ls(x)),x
			if(ikey(i,'here'))return self.here=max(0,ln(x)),x
		}else{
			if(ikey(i,'encoded'))return lms(array_write(self))
			if(ikey(i,'cast'   ))return lms(self.cast)
			if(ikey(i,'size'   ))return lmn(self.size/casts[self.cast])
			if(ikey(i,'here'   ))return lmn(self.here)
			if(ikey(i,'slice'  ))return lmnat(z=>slice (self,z))
			if(ikey(i,'copy'   ))return lmnat(z=>copy  (self,z))
			if(ikey(i,'struct' ))return lmnat(z=>struct(self,z))
			if(ikey(i,'cat'    ))return lmnat(z=>cat   (self,z))
		}return x?x:NONE
	},'array')
	ri.size=size*casts[cast],ri.here=0,ri.base=base,ri.cast=cast,ri.data=buffer||new Uint8Array(ri.size)
	return ri
}

export const find_occupied=(image,mask)=>{
	const s=image.size,d=rcopy(s);for(let z=0;z<image.pix.length;z++){
		if(image.pix[z]==mask)continue;const x=z%s.x, y=0|(z/s.x);d.x=min(d.x,x), d.y=min(d.y,y), d.w=max(d.w,x), d.h=max(d.h,y)
	}d.w-=d.x,d.h-=d.y,d.w++,d.h++;return d
}
export const image_copy=(i,r)=>{
	r=r?rint(r):rect(0,0,i.size.x,i.size.y);const c=image_make(rect(r.w,r.h)), clip=rect(0,0,i.size.x,i.size.y)
	for(let y=0;y<r.h;y++)for(let x=0;x<r.w;x++)c.pix[x+r.w*y]=rin(clip,rect(r.x+x,r.y+y))?i.pix[(r.x+x)+i.size.x*(r.y+y)]:0
	return c
}
export const image_paste=(r,clip,src,dst,opaque)=>{
	r=rint(r);const s=src.size,ds=dst.size
	for(let y=0;y<s.y;y++)for(let x=0;x<s.x;x++)if(rin(clip,rect(r.x+x,r.y+y))&&(opaque||src.pix[x+s.x*y]))dst.pix[r.x+x+ds.x*(r.y+y)]=src.pix[x+s.x*y]
}
export const lerp_scale=(r,s)=>rect(r.w/s.x,r.h/s.y)
export const image_paste_scaled=(r,clip,src,dst,opaque)=>{
	r=rint(r);if(r.w==0||r.h==0)return;const s=src.size,ds=dst.size,sc=lerp_scale(r,s)
	if(r.w==s.x&&r.h==s.y)return image_paste(r,clip,src,dst,opaque)
	for(let a=0;a<r.h;a++)for(let b=0;b<r.w;b++){
		let sx=0|(b/sc.x), sy=0|(a/sc.y), c=src.pix[sx+sy*s.x]
		if((opaque||c!=0)&&rin(clip,rect(r.x+b,r.y+a)))dst.pix[r.x+b+ds.x*(r.y+a)]=c
	}
}
export const image_dither=i=>{
	const stride=2*i.size.x, m=[0,1,i.size.x-2,i.size.x-1,i.size.x,stride-1], e=new Float32Array(stride)
	for(let ei=0,z=0;z<i.pix.length;z++){
		const pix=((0xFF&i.pix[z])/256.0)+e[ei], col=pix>.5?1:0, err=(pix-col)/8.0
		e[ei]=0, ei=(ei+1)%stride; for(let x=0;x<6;x++)e[(ei+m[x])%stride]+=err; i.pix[z]=!col
	}
}
export const image_flip_h=i=>{const s=i.size;for(let z=0;z<s.y;z++){let a=z*s.x,b=(z+1)*s.x-1;while(a<b){let t=i.pix[a];i.pix[a]=i.pix[b];i.pix[b]=t;a++;b--}}}
export const image_flip_v=i=>{const s=i.size;for(let z=0;z<s.x;z++){let a=z,b=z+s.x*(s.y-1);while(a<b){let t=i.pix[a];i.pix[a]=i.pix[b];i.pix[b]=t;a+=s.x;b-=s.x}}}
export const image_flip=i=>{const s=i.size,r=image_make(rect(s.y,s.x));for(let a=0;a<s.y;a++)for(let b=0;b<s.x;b++)r.pix[a+s.y*b]=i.pix[b+s.x*a];i.pix=r.pix,i.size=r.size}
export const image_resize=(i,size)=>{
	const os=i.size,ob=i.pix;size=rint(rmax(size,rect()));if(requ(os,size))return i;if(size.x==0||size.y==0)size=rect()
	i.pix=new Uint8Array(size.x*size.y),i.size=size;
	for(let a=0;a<size.y;a++)for(let b=0;b<size.x;b++)i.pix[b+a*size.x]=a>=os.y||b>=os.x?0: ob[b+a*os.x];return i
}
export const buffer_map=(buff,x,fill)=>{
	const m=new Uint8Array(256);for(let z=0;z<256;z++)m[z]=fill?ln(fill):z;x=ld(x)
	for(let z=0;z<x.k.length;z++){let k=0|ln(x.k[z]);if(k>=-128&&k<=255)m[0xFF&k]=0xFF&ln(x.v[z])}
	for(let z=0;z<buff.length;z++)buff[z]=m[buff[z]]
}
export const buffer_hist=(buff,sign)=>{
	const b_extend=u=>(u)|(0-((u)&0x80)),r=lmd(),c=new Float32Array(256);for(let z=0;z<buff.length;z++)c[buff[z]]++
	for(let z=0;z<256;z++)if(c[z]!=0)dset(r,lmn(sign?b_extend(z):z),lmn(c[z]));return r
}
export const image_merge_op=(target,src,op)=>{
	const ts=target.size,bs=src.size,t=target.pix,b=src.pix;if(bs.x==0||bs.y==0)return
	if(op=='+')for(let y=0,i=0;y<ts.y;y++)for(let x=0;x<ts.x;x++,i++)t[i]+=        b[(x%bs.x)+(y%bs.y)*bs.x]
	if(op=='-')for(let y=0,i=0;y<ts.y;y++)for(let x=0;x<ts.x;x++,i++)t[i]-=        b[(x%bs.x)+(y%bs.y)*bs.x]
	if(op=='*')for(let y=0,i=0;y<ts.y;y++)for(let x=0;x<ts.x;x++,i++)t[i]*=        b[(x%bs.x)+(y%bs.y)*bs.x]
	if(op=='&')for(let y=0,i=0;y<ts.y;y++)for(let x=0;x<ts.x;x++,i++)t[i]=min(t[i],b[(x%bs.x)+(y%bs.y)*bs.x])
	if(op=='|')for(let y=0,i=0;y<ts.y;y++)for(let x=0;x<ts.x;x++,i++)t[i]=max(t[i],b[(x%bs.x)+(y%bs.y)*bs.x])
	if(op=='<')for(let y=0,i=0;y<ts.y;y++)for(let x=0;x<ts.x;x++,i++)t[i]=t[i] <   b[(x%bs.x)+(y%bs.y)*bs.x]
	if(op=='>')for(let y=0,i=0;y<ts.y;y++)for(let x=0;x<ts.x;x++,i++)t[i]=t[i] >   b[(x%bs.x)+(y%bs.y)*bs.x]
	if(op=='=')for(let y=0,i=0;y<ts.y;y++)for(let x=0;x<ts.x;x++,i++)t[i]=t[i]==   b[(x%bs.x)+(y%bs.y)*bs.x]
}
export const image_make=size=>{
	size=rint(size)
	const f=(self,i,x)=>{
		const s=self.size
		if(i&&lil(i)){ // read/write single pixels
			const p=getpair(i),ib=p.x>=0&&p.y>=0&&p.x<s.x&&p.y<s.y
			if(x){if(ib)self.pix[p.x+p.y*s.x]=ln(x);return x}
			return ib?lmn(self.pix[p.x+p.y*s.x]):NONE
		}
		if(ikey(i,'pixels')){ // read/write all pixels
			if(x){ll(monad.raze(lml(ll(x)))).forEach((v,i)=>self.pix[i]=ln(v));return x}
			const r=[];for(let y=0;y<s.y;y++){const t=[];for(let x=0;x<s.x;x++)t.push(lmn(self.pix[x+y*s.x]));r.push(lml(t))}return lml(r)
		}
		if(ikey(i,'encoded'))return lms(image_write(self))
		if(ikey(i,'hist'))return buffer_hist(self.pix,0)
		if(ikey(i,'size'))return x?(image_resize(self,getpair(x)),x): lmpair(self.size)
		if(ikey(i,'map'))return lmnat(([x,fill])=>(buffer_map(self.pix,x,fill),self))
		if(ikey(i,'merge'))return lmnat(z=>{
			if(lis(z[0])){if(image_is(z[1]))image_merge_op(self,z[1],ls(z[0])[0]);return self}
			if(lil(z[0]))z=ll(z[0]);const nice=x=>x&&image_is(x)&&x.size.x>0&&x.size.y>0, s=self.size
			const v=new Uint8Array(256),sx=new Uint32Array(256),sy=new Uint32Array(256)
			for(let p=0;p<z.length&&p<256;p++)if(nice(z[p]))v[p]=1,sx[p]=z[p].size.x,sy[p]=z[p].size.y
			for(let y=0,i=0;y<s.y;y++)for(let x=0;x<s.x;x++,i++){const p=self.pix[i],c=v[p]?z[p].pix[(x%sx[p])+(y%sy[p])*sx[p]]:0;self.pix[i]=c}
			return self
		})
		if(ikey(i,'transform'))return lmnat(([x])=>{
			if(x.v=='horiz')image_flip_h(self); if(x.v=='vert')image_flip_v(self); if(x.v=='flip')image_flip(self); if(x.v=='dither')image_dither(self)
			if(x.v=='left' )image_flip_h(self),image_flip(self); if(x.v=='right')image_flip(self),image_flip_h(self)
			return self
		})
		if(ikey(i,'rotate'))return lmnat(([n])=>{
			n=-(ln(n)%(2*Math.PI));if(abs(n)>Math.PI/2&&abs(n)<Math.PI*3/2)image_flip_v(self),image_flip_h(self),n+=(n<0?1:-1)*Math.PI
			const s=self.size,t=image_make(s)
			const shx=n=>{for(let y=0;y<s.y;y++){const o=0|(n*(y-s.y/2));for(let x=0;x<s.x;x++)t.pix[x+y*s.x]=self.pix[mod(x+o,s.x)+y*s.x]};self.pix.set(t.pix)}
			const shy=n=>{for(let x=0;x<s.x;x++){const o=0|(n*(x-s.x/2));for(let y=0;y<s.y;y++)t.pix[x+y*s.x]=self.pix[x+mod(y+o,s.y)*s.x]};self.pix.set(t.pix)}
			shx(-Math.tan(n/2)),shy(Math.sin(n)),shx(-Math.tan(n/2));return self
		})
		if(ikey(i,'translate'))return lmnat(([x,y])=>{
			const o=rint(getpair(x)), w=y?lb(y):0;if(o.x==0&&o.y==0)return self;const s=self.size,t=image_make(s)
			if(w){for(let y=0,z=0;y<s.y;y++)for(let x=0;x<s.x;x++,z++)                           t.pix[z]=self.pix[mod(x-o.x,s.x)+mod(y-o.y,s.y)*s.x]}
			else {for(let y=0,z=0;y<s.y;y++)for(let x=0;x<s.x;x++,z++){const i=rect(x-o.x,y-o.y);t.pix[z]=(i.x<0||i.x>=s.x||i.y<0||i.y>=s.y)?0: self.pix[i.x+i.y*s.x]}}
			self.pix.set(t.pix);return self
		})
		if(ikey(i,'scale'))return lmnat(([z])=>{
			const o=image_copy(self), n=lin(z)?rect(ln(z),ln(z)):getpair(z), r=rmax(rect(),rint(rect(n.x*o.size.x,n.y*o.size.y))), d=rpair(rect(),r)
			image_resize(self,r),image_paste_scaled(d,d,o,self,1);return self
		})
		if(ikey(i,'copy'))return lmnat(z=>image_copy(self,unpack_rect(z,self.size)))
		if(ikey(i,'paste'))return lmnat(([img,pos,t])=>{
			img=getimage(img), pos=(pos?ll(pos):[]).map(ln); let solid=t?!lb(t):1, cl=rect(0,0,self.size.x,self.size.y); if(img==self)img=image_copy(img)
			image_paste_scaled(pos.length<=2?rect(pos[0],pos[1],img.size.x,img.size.y):rect(pos[0],pos[1],pos[2],pos[3]),cl,img,self,solid);return self
		})
		return x?x:NONE
	};return {t:'int',f:f,n:'image',size:size,pix:new Uint8Array(size.x*size.y)}
}
export const image_read=x=>{
	const data=data_read('IMG',x);if(!data||data.length<4)return image_make(rect())
	const f=data_enc(x), w=(data[0]<<8)|data[1], h=(data[2]<<8)|data[3], r=image_make(rect(w,h))
	if(f==0&&data.length-4>=w*h/8){let s=ceil(w/8),o=0;for(let a=0;a<h;a++)for(let b=0;b<w;b++)r.pix[o++]=data[4+(0|b/8)+a*s]&(1<<(7-(b%8)))?1:0}
	if(f==1&&data.length-4>=w*h){r.pix=data.slice(4)}
	if(f==2){let i=4,o=0;while(i+2<=data.length){let p=data[i++],c=0xFF&data[i++];while(c&&o+1<=r.pix.length)c--,r.pix[o++]=p;}}
	return r
}
export const image_write=x=>{
	x=image_is(x)?x:image_make(rect());let f=0,s=x.size,t=[0xFF&(s.x>>8),0xFF&s.x,0xFF&(s.y>>8),0xFF&s.y],l=t.slice(0)
	for(let z=0;z<x.pix.length;){let c=0,p=x.pix[z];while(c<255&&z<x.pix.length&&x.pix[z]==p)c++,z++;l.push(p),l.push(c)}
	if(!x.pix.some(x=>x>1)&&(l.length>4+s.x*s.y/8)){
		f='0';let stride=8*ceil(s.x/8);for(let a=0;a<s.y;a++)for(let b=0;b<stride;b+=8)
		{let v=0;for(let i=0;i<8;i++)v=(v<<1)|(b+i>=s.x?0: x.pix[b+i+a*s.x]?1:0);t.push(v)}
	}else if(l.length>4+s.x*s.y){f='1';for(let z=0;z<s.x*s.y;z++)t.push(x.pix[z])}else{f='2',t=l}
	return data_write('IMG'+f,t)
}
export const n_image=([size])=>lis(size)?image_read(ls(size)):image_make(getpair(size))
export const is_blank=x=>!image_is(x)?0: !x.pix.some(x=>x>0)

export const sound_make=data=>{
	const sign_extend=x=>(x<<24>>24)
	const ri=lmi((self,i,x)=>{
		if(i&&lin(i)){ // read/write single samples
			return x?((self.data[ln(i)]=0xFF&ln(x)),x):lmn(sign_extend(self.data[ln(i)]))
		}
		if(i&&lil(i)){ // read/write ranges
			const n=getpair(i);n.y=max(0,n.y);if(x){
				const s=ll(x),dc=self.data.length,sc=s.length, r=new Uint8Array(clamp(0,(dc-n.y)+sc,10*SFX_RATE))
				for(let z=0;z<n.x         ;z++)r[z]=self.data[z]
				for(let z=0;z<sc          ;z++)r[n.x+z   ]=0xFF&ln(s[z])
				for(let z=0;z<dc-(n.x+n.y);z++)r[n.x+sc+z]=0xFF&self.data[n.x+n.y+z]
				return self.data=r,x
			}else{return lml(range(n.y).map(x=>lmn(sign_extend(self.data[x+n.x]))))}
		}
		if(ikey(i,'encoded'))return lms(sound_write(self))
		if(ikey(i,'hist'))return buffer_hist(self.data,1)
		if(ikey(i,'size')){
			if(!x)return lmn(self.data.length)
			const n=clamp(0,ln(x),10*SFX_RATE),o=self.data;self.data=new Uint8Array(n)
			for(let z=0;z<o.length&&z<n;z++)self.data[z]=o[z];return x
		}
		if(ikey(i,'duration'))return lmn(self.data.length/SFX_RATE)
		if(ikey(i,'map'))return lmnat(([x,fill])=>(buffer_map(self.data,x,fill),self))
		return x?x:NONE
	},'sound')
	if(data&&data.length>10*SFX_RATE)data=data.slice(0,10*SFX_RATE)
	ri.data=data||new Uint8Array(0)
	return ri
}
export const sound_read=x=>sound_make((typeof x=='string')?data_read('SND',x):new Uint8Array(clamp(0,+x,10*SFX_RATE)))
export const sound_write=x=>data_write('SND0',x.data)
export const n_sound=([x])=>!x?sound_read(0): lis(x)?sound_read(ls(x)): lin(x)?sound_read(ln(x)): sound_make(Uint8Array.from(ll(x).map(ln)))

export const pal_col_get=(pal,c)=>{const b=(8*224)+(3*c);return 0xFF000000|((pal[b]<<16)|(pal[b+1]<<8)|pal[b+2])}
export const pal_col_set=(pal,c,x)=>{const b=(8*224)+(3*c);pal[b]=0xFF&(x>>16),pal[b+1]=0xFF&(x>>8),pal[b+2]=0xFF&x}
export const pick_palette=deck=>{for(let z=0;z<16;z++)COLORS[z]=pal_col_get(deck.patterns.pal.pix,z)}
export const patterns_read=x=>{
	const set=(pal,p,x,y,v)=>pal[(x%8)+(8*(y%8))+(8*8*p)]=v
	const ri=lmi((self,i,x)=>{
		let r=null, t=i&&ln(i)?ln(i):0
		if(x){
			if(t>= 2&&t<=27&&image_is(x)){for(let a=0;a<8;a++)for(let b=0;b<8;b++)set(self.pal.pix,t,b,a,lb(iwrite(x,lmpair(rect(b,a)))))}
			if(t>=28&&t<=31){r=ll(x);if(r.length>8)r=r.slice(0,8);self.anim[t-28]=r.map(x=>{const f=clamp(0,ln(x),47);return f>=28&&f<=31?0:f});r=lml(r)}
			if(t>=32&&t<=47){pal_col_set(self.pal.pix,t-32,0xFF000000|ln(x));r=x}
		}else{
			if(t>= 0&&t<=27){r=image_copy(self.pal,rect(0,t*8,8,8))}
			if(t>=28&&t<=31){r=lml(self.anim[t-28].map(lmn))}
			if(t>=32&&t<=47){r=lmn(0xFFFFFF&pal_col_get(self.pal.pix,t-32))}
		}return r?r:x?x:NONE
	},'patterns')
	let i=image_read(x.patterns?ls(x.patterns):DEFAULT_PATTERNS)
	if(i.size.x!=8||i.size.y!=224+6){i=image_resize(i,rect(8,224+6));for(let z=0;z<16;z++)pal_col_set(i.pix,z,DEFAULT_COLORS[z])}
	ri.pal=i
	ri.anim=JSON.parse(DEFAULT_ANIMS);if(x.animations&&lil(x.animations))ll(x.animations).map((x,i)=>iindex(ri,28+i,x))
	return ri
}
export const patterns_write=x=>{
	const p=x.pal.pix, c=DEFAULT_COLORS.some((x,i)=>(0xFFFFFF&x)!=(0xFFFFFF&pal_col_get(p,i)))
	return image_write(image_resize(image_copy(x.pal),rect(8,224+(6*c))))
}
export const anims_write=x=>lml(x.anim.map(x=>lml(x.map(lmn))))

export const font_get=(i,f,v)=>{if(v!=undefined)f.pix[i]=v;return f.pix[i]}
export const font_w =(f,v)=>font_get(0,f,v)
export const font_h =(f,v)=>font_get(1,f,v)
export const font_sw=(f,v)=>font_get(2,f,v)
export const font_gs=(f,v)=>font_h(f)*ceil(font_w(f)/8)+1
export const font_gb=(f,c)=>3+(c.charCodeAt(0)-32)*font_gs(f)
export const font_gw=(f,c,v)=>font_get(font_gb(f,c),f,v)
export const font_pp=(f,c,x,y,v)=>font_get(font_gb(f,c)+1+y*ceil(font_w(f)/8)+Math.floor(x/8),f,v)
export const font_bit=(x,v)=>(v<<(7-(x%8)))
export const font_gpix=(f,c,x,y)=>((font_pp(f,c,x,y)&font_bit(x,1))?1:0)
export const font_spix=(f,c,x,y,v)=>font_pp(f,c,x,y,(font_pp(f,c,x,y)&~font_bit(x,1))|font_bit(x,v))
export const font_textsize=(f,t)=>{
	const cursor=rect(),size=rect(0,font_h(f))
	for(let z=0;t[z];z++){if(t[z]!='\n'){cursor.x+=font_gw(f,t[z])+font_sw(f),size.x=max(size.x,cursor.x)}else{cursor.x=0,size.y+=font_h(f)}}
	return size
}
export const font_read=s=>{
	const ri=lmi((self,i,x)=>{
		if(lin(i)||(lis(i)&&count(i)==1)){ // read/write glyphs
			let ix=lin(i)?ln(i): ls(i).charCodeAt(0)-32, c=String.fromCharCode(ix+32)
			if(x){
				if(!image_is(x)||ix<0||ix>95)return x;font_gw(self,c,min(x.size.x,font_w(self)));const s=rect(font_gw(self,c),font_h(self))
				for(let a=s.y-1;a>=0;a--)for(let b=s.x-1;b>=0;b--)font_spix(self,c,b,a, b>=(x.size.x||a>=x.size.y)?0:x.pix[b+a*x.size.x]?1:0)
				return x
			}
			if(ix<0||ix>95)return image_make(rect())
			const s=rect(font_gw(self,c),font_h(self)),r=image_make(s)
			for(let a=s.y-1;a>=0;a--)for(let b=s.x-1;b>=0;b--)r.pix[b+a*s.x]=font_gpix(self,c,b,a)
			return r
		}
		if(x){
			if(ikey(i,'space'))return font_sw(self,ln(x)),x
			if(ikey(i,'size')){
				const r=font_read(rmax(rint(getpair(x)),rect(1,1)));iwrite(r,lms('space'),ifield(self,'space'))
				for(let z=0;z<96;z++)iindex(r,z,iindex(self,z));self.pix=r.pix;return x
			}
		}else{
			if(ikey(i,'size'))return lmpair(rect(font_w(self),font_h(self)))
			if(ikey(i,'space'))return lmn(font_sw(self))
			if(ikey(i,'textsize'))return lmnat(([x])=>lmpair(font_textsize(self,x?ls(x):'')))
		}return x?x:NONE
	},'font')
	if(typeof s=='string')ri.pix=data_read('FNT',s); s=rmax(rint(s),rect(1,1))
	if(!ri.pix){ri.pix=new Uint8Array(3+96*(1+s.y*ceil(s.x/8.0)));font_w(ri,s.x),font_h(ri,s.y),font_sw(ri,1)}
	return ri
}
export const font_write=x=>data_write('FNT0',x.pix)

export const rtext_empty=_=>{const r=lmt();tab_set(r,'text',[]),tab_set(r,'font',[]),tab_set(r,'arg',[]);return r}
export const rtext_len=tab=>tab_get(tab,'text').reduce((x,y)=>x+ls(y).length,0)
export const rtext_get=(tab,n)=>{const t=tab_get(tab,'text');let i=0;for(let z=0;z<t.length;z++){i+=count(t[z]);if(i>=n)return z}return -1}
export const rtext_getr=(tab,x)=>{const t=tab_get(tab,'text');let i=0;for(let z=0;z<t.length;z++){const c=count(t[z]);if(i+c>=x)return rect(i,i+c);i+=c}return rect(x,x)}
export const rtext_make=(t,f,a)=>{
	a=!a?'':image_is(a)?a:ls(a), f=!f?'':ls(f), t=image_is(a)?'i':!t?'':count(t)?ls(t):''
	const r=lmt();tab_set(r,'text',[lms(t)]),tab_set(r,'font',[lms(f)]),tab_set(r,'arg',[image_is(a)?a:lms(a)]);return r
}
export const rtext_cast=x=>{
	if(!x)x=lms('');if(image_is(x))return rtext_make('','',x);if(lid(x))x=monad.table(x);if(!lit(x))return rtext_make(x)
	const tv=tab_get(x,'text'),fv=tab_get(x,'font'),av=tab_get(x,'arg')
	if(tv&&fv&&av&&tv.every((t,i)=>lis(t)&&lis(fv[i])&&(image_is(av[i])||lis(av[i]))))return x
	const r=lmt();tab_set(r,'text',tv||[lms('')]),tab_set(r,'font',fv||[lms('')]),tab_set(r,'arg',av||[lms('')])
	const tr=tab_get(r,'text'),fr=tab_get(r,'font'),ar=tab_get(r,'arg')
	tr.map((_,z)=>{const i=image_is(ar[z]);tr[z]=i?lms('i'):lms(ls(tr[z]));fr[z]=lms(ls(fr[z]));ar[z]=i?ar[z]:lms(ls(ar[z]))});return r
}
export const rtext_append=(tab,t,f,a)=>{
	if(image_is(a)){if(count(t)>1)t=lms('i');if(count(t)<1)return 0;}if(!count(t))return 0;
	const tv=tab_get(tab,'text'),fv=tab_get(tab,'font'),av=tab_get(tab,'arg')
	if(tv.length&&match(f,last(fv))&&!image_is(a)&&match(a,last(av))){tv[tv.length-1]=lms(ls(last(tv))+ls(t))}
	else{tv.push(t),fv.push(f),av.push(a)}return count(t)
}
export const rtext_appendr=(tab,row)=>{fv=tab_get(row,'font'),av=tab_get(row,'arg');tab_get(row,'text').map((t,i)=>rtext_append(tab,t,fv[i],av[i]))}
export const rtext_string=(tab,pos)=>{
	pos=pos||rect(0,RTEXT_END);let r='',i=0,a=min(pos.x,pos.y),b=max(pos.x,pos.y)
	tab_get(tab,'text').map(s=>{for(let z=0;z<s.v.length;z++,i++)if(i>=a&&i<b)r+=s.v[z]});return lms(r)
}
export const rtext_is_plain=x=>{
	if(!lit(x))return 0;const tv=tab_get(x,'text'),fv=tab_get(x,'font'),av=tab_get(x,'arg');
	if(!tv||!fv||!av||tv.length>1)return 0;if(tv.length==0)return 1
	return ls(fv[0])==''&&!image_is(av[0])&&ls(av[0])==''
}
export const rtext_is_image=x=>{
	let r=null,t=tab_get(x,'text'),a=tab_get(x,'arg'); // look for at least one image, and other spans must be only whitespace.
	for(let z=0;z<count(x);z++){if(image_is(a[z])){if(!r)r=a[z]}else if(ls(t[z]).trim()!=''){return null}}
	return r
}
export const rtext_read_images=x=>lml((tab_get(x,'arg')||[]).filter(image_is))
export const rtext_write_images=x=>rtext_cat(ll(x))
export const rtext_span=(tab,pos)=>{
	const tv=tab_get(tab,'text'),fv=tab_get(tab,'font'),av=tab_get(tab,'arg')
	let r=dyad.take(NONE,tab), i=0,c=0,a=min(pos.x,pos.y),b=max(pos.x,pos.y), partial=_=>{
		let rr='';for(let z=0;z<count(tv[c]);z++,i++)if(i>=a&&i<b)rr+=tv[c].v[z]
		rtext_append(r,lms(rr),fv[c],av[c]),c++
	}
	while(c<tv.length&&(i+count(tv[c]))<a)i+=count(tv[c++])                       ;if(c<tv.length&&i<=a)partial()
	while(c<tv.length&&(i+count(tv[c]))<b)i+=rtext_append(r,tv[c],fv[c],av[c]),c++;if(c<tv.length&&i< b)partial()
	return r
}
export const rtext_splice=(tab,font,arg,text,cursor,endcursor)=>{
	const a=min(cursor.x,cursor.y),b=max(cursor.x,cursor.y),r=rtext_cast()
	rtext_appendr(r,rtext_span(tab,rect(0,a)))
	rtext_append (r,lms(text),font,arg)
	rtext_appendr(r,rtext_span(tab,rect(b,RTEXT_END)))
	endcursor.x=endcursor.y=a+text.length;return r
}
export const rtext_splicer=(tab,insert,cursor,endcursor)=>{
	const a=min(cursor.x,cursor.y),b=max(cursor.x,cursor.y),r=rtext_cast()
	rtext_appendr(r,rtext_span(tab,rect(0,a)))
	rtext_appendr(r,insert)
	rtext_appendr(r,rtext_span(tab,rect(b,RTEXT_END)))
	endcursor.x=endcursor.y=a+rtext_len(insert);return r
}
export const rtext_write=x=>{const r=monad.cols(x),arg=dget(r,lms('arg'));if(arg){arg.v=arg.v.map(x=>image_is(x)?lms(image_write(x)):x)};return r}
export const rtext_read=x=>{
	if(lis(x))return x;x=ld(x)
	const a=dget(x,lms('arg'));if(a){dset(x,lms('arg'),lml(ll(a).map(a=>ls(a).startsWith('%%IMG')?image_read(ls(a)):lms(ls(a)))))}
	return rtext_cast(x)
}
export const rtext_encode=x=>`%%RTX0${fjson(rtext_write(x))}`
export const rtext_decode=x=>rtext_read(pjson(x,6,x.length-6).value)
export const rtext_cat=x=>{let r=rtext_empty();x.map(x=>rtext_appendr(r,rtext_cast(x)));return r}
export const interface_rtext=lmi((self,i,x)=>{
	if(ikey(i,'end'   ))return lmn(RTEXT_END)
	if(ikey(i,'make'  ))return lmnat(([t,f,a])=>rtext_make(t,f,a))
	if(ikey(i,'len'   ))return lmnat(([t])=>lmn(rtext_len(rtext_cast(t))))
	if(ikey(i,'get'   ))return lmnat(([t,n])=>lmn(rtext_get(rtext_cast(t),n?ln(n):0)))
	if(ikey(i,'string'))return lmnat(([t,i])=>rtext_string(rtext_cast(t),i?getpair(i):undefined))
	if(ikey(i,'span'  ))return lmnat(([t,i])=>rtext_span  (rtext_cast(t),i?getpair(i):undefined))
	if(ikey(i,'cat'   ))return lmnat(rtext_cat)
	if(ikey(i,'split' ))return lmnat(([x,y])=>{
		const d=ls(x),v=rtext_cast(y),t=ls(rtext_string(v)),r=lml([]);if(d.length<1||!x||!y)return r
		let n=0;for(let z=0;z<t.length;z++){
			let m=1;for(let w=0;w<d.length;w++)if(d[w]!=t[z+w]){m=0;break}if(m){r.v.push(rtext_span(v,rect(n,z))),z+=d.length-1,n=z+1}
		}if(n<=t.length)r.v.push(rtext_span(v,rect(n,t.length)));return r
	})
	if(ikey(i,'replace'))return lmnat(([tab,k,v,i])=>{
		if(!k||!v)return tab||NONE;const t=rtext_cast(tab),r=[],tx=ls(rtext_string(t)),nocase=i&&lb(i),text=nocase?tx.toLowerCase():tx,c=rect(0,0)
		if(!lil(k))k=monad.list(k);if(!lil(v))v=monad.list(v)
		k=dyad.take(lmn(max(count(k),count(v))),dyad.drop(lms(''),k)),k.v=k.v.map(nocase?x=>ls(x).toLowerCase():ls)
		v=dyad.take(lmn(max(count(k),count(v))),v),v.v=v.v.map(rtext_cast)
		while(c.y<text.length){
			let any=0;k.v.map((key,ki)=>{
				const val=v.v[ki];let f=1;for(let i=0;i<key.length;i++)if(text[c.y+i]!=key[i]){f=0;break}
				if(f){if(c.x!=c.y)r.push(rtext_span(t,c));r.push(r,val),c.x=c.y=(c.y+key.length),any=1}
			});if(!any)c.y++
		}if(c.x<text.length)r.push(rtext_span(t,rect(c.x,RTEXT_END)));return rtext_cat(r)
	})
	if(ikey(i,'find'))return lmnat(([tab,k,i])=>{
		const r=[];if(!tab||!k)return lml(r);const nocase=i&&lb(i),tx=ls(rtext_string(rtext_cast(tab))),text=nocase?tx.toLowerCase():tx
		k=lil(k)?ll(k):[k];k=k.map(x=>nocase?ls(x).toLowerCase(): ls(x))
		for(let x=0;x<text.length;){
			let any=0;for(let ki=0;ki<k.length;ki++){
				const key=k[ki];let f=1;for(let i=0;i<key.length;i++)if(text[x+i]!=key[i]){f=0;break}
				if(f){r.push(lml([lmn(x),lmn(x+key.length)])),x+=max(1,key.length),any=1;break}
			}if(!any)x++
		}return lml(r)
	})
	if(ikey(i,'index'))return lmnat(([tab,g])=>{
		if(!tab)return NONE;let r=0;const t=ls(rtext_string(rtext_cast(tab)));g=g?rint(getpair(g)):rect()
		while(r<t.length&&g.x>0)if(t[r++]=='\n')g.x--;while(r<t.length&&g.y>0&&t[r]!='\n'){g.y--,r++};return lmn(r)
	})
	return x?x:NONE
},'rtext')
export const button_styles={round:1,rect:1,check:1,invisible:1}
export const normalize_shortcut=x=>ls(x).toLowerCase().replace(/[^a-z0-9 ]/g,'').slice(0,1)
export const button_read=(x,card)=>{
	const ri=lmi((self,i,x)=>{
		if(!is_rooted(self))return NONE
		if(x){
			if(ikey(i,'value'   ))return self.value=lb(x),x
			if(ikey(i,'text'    ))return self.text=ls(x),x
			if(ikey(i,'style'   ))return self.style=normalize_enum(button_styles,ls(x)),x
			if(ikey(i,'shortcut'))return self.shortcut=normalize_shortcut(x),x
		}else{
			if(ikey(i,'value'   ))return value_inherit(self,ls(i))||NONE
			if(ikey(i,'text'    ))return lms(ivalue(self,ls(i),''))
			if(ikey(i,'style'   ))return lms(ivalue(self,ls(i),'round'))
			if(ikey(i,'size'    ))return lmpair(ivalue(self,ls(i),rect(60,20)))
			if(ikey(i,'shortcut'))return lms(ivalue(self,ls(i),''))
		}return interface_widget(self,i,x)
	},'button');ri.card=card
	init_field(ri,'text'    ,x)
	init_field(ri,'style'   ,x)
	init_field(ri,'value'   ,x)
	init_field(ri,'shortcut',x)
	return ri
}
export const button_write=x=>{
	const r=lmd([lms('type')],[lms('button')])
	if(x.text)dset(r,lms('text' ),lms(x.text))
	if(x.style&&x.style!='round')dset(r,lms('style'),lms(x.style))
	if(x.value!=undefined&&!x.volatile)dset(r,lms('value'),lmn(x.value))
	if(x.shortcut)dset(r,lms('shortcut'),lms(x.shortcut))
	return r
}
export const field_styles={rich:1,plain:1,code:1}
export const field_aligns={left:1,center:1,right:1}
export const field_read=(x,card)=>{
	const ri=lmi((self,i,x)=>{
		if(!is_rooted(self))return NONE
		if(x){
			if(ikey(i,'text'  ))return self.value=rtext_cast(lms(ls(x))),field_notify(self),x
			if(ikey(i,'images'))return self.value=rtext_write_images(x),field_notify(self),x
			if(ikey(i,'data'  ))return self.value=rtext_cast(dyad.format(lms('%J'),monad.list(x))),field_notify(self),x
			if(ikey(i,'scroll'))return self.scroll=max(0,ln(x)),x
			if(ikey(i,'value' )){
				if(ls(ifield(self,'style'))!='rich'&&!rtext_is_plain(x))x=rtext_string(rtext_cast(x))
				return self.value=rtext_cast(x),field_notify(self),x
			}
			if(ikey(i,'border'   ))return self.border=lb(x),x
			if(ikey(i,'scrollbar'))return self.scrollbar=lb(x),x
			if(ikey(i,'style'    ))return self.style=normalize_enum(field_styles,ls(x)),iwrite(self,lms('value'),ifield(self,'value')),x
			if(ikey(i,'align'    ))return self.align=normalize_enum(field_aligns,ls(x)),x
		}else{
			if(ikey(i,'text'     )){const v=value_inherit(self,'value');return v!=undefined?rtext_string(v):lms('')}
			if(ikey(i,'images'   )){const v=value_inherit(self,'value');return v!=undefined?rtext_read_images(v):lml([])}
			if(ikey(i,'data'     )){const v=value_inherit(self,'value');return v!=undefined?dyad.parse(lms('%J'),rtext_string(v)):NONE}
			if(ikey(i,'border'   ))return lmn(ivalue(self,ls(i),1))
			if(ikey(i,'value'    ))return value_inherit(self,ls(i))||rtext_cast()
			if(ikey(i,'scroll'   ))return value_inherit(self,ls(i))||NONE
			if(ikey(i,'scrollbar'))return lmn(ivalue(self,ls(i),0))
			if(ikey(i,'style'    ))return lms(ivalue(self,ls(i),'rich'))
			if(ikey(i,'align'    ))return lms(ivalue(self,ls(i),'left'))
			if(ikey(i,'size'     ))return lmpair(ivalue(self,ls(i),rect(100,20)))
			if(ikey(i,'font'     ))return dget(self.card.deck.fonts,lms(self.font||(self.style=='code'?'mono':'body')))
			if(ikey(i,'scrollto' ))return lmnat(([x])=>{
				const bi=inset(rpair(getpair(ifield(self,'pos')),getpair(ifield(self,'size'))),2);if(lb(ifield(self,'scrollbar')))bi.w-=12+3
				const l=layout_richtext(self.card.deck,ifield(self,'value'),ifield(self,'font'),ALIGN[ls(ifield(self,'align'))],bi.w)
				const i=x?min(max(0,0|ln(monad.first(x))),l.layout.length-1):0, c=rcopy(l.layout[i].pos), os=ln(ifield(self,'scroll'));c.y-=os
				const ch=min(bi.h,c.h);let t=os;if(c.y<0){t+=c.y};if(c.y+ch>=bi.h){t+=((c.y+ch)-bi.h)}
				if(t!=os)iwrite(self,lms('scroll'),lmn(t));return self
			})
		}return interface_widget(self,i,x)
	},'field');ri.card=card
	{const k=lms('value'),v=dget(x,k);if(v)iwrite(ri,k,rtext_read(v))}
	init_field(ri,'border'   ,x)
	init_field(ri,'scrollbar',x)
	init_field(ri,'style'    ,x)
	init_field(ri,'align'    ,x)
	init_field(ri,'scroll'   ,x)
	return ri
}
export const field_write=x=>{
	const r=lmd([lms('type')],[lms('field')])
	if(x.border!=undefined)dset(r,lms('border'),lmn(x.border))
	if(x.scrollbar!=undefined)dset(r,lms('scrollbar'),lmn(x.scrollbar))
	if(x.style&&x.style!='rich')dset(r,lms('style'),lms(x.style))
	if(x.align&&x.align!='left')dset(r,lms('align'),lms(x.align))
	if(x.scroll&&!x.volatile)dset(r,lms('scroll'),lmn(x.scroll))
	if(x.value&&!x.volatile){if(rtext_is_plain(x.value)){const v=rtext_string(x.value);if(ls(v))dset(r,lms('value'),v)}else{dset(r,lms('value'),rtext_write(x.value))}}
	return r
}
export const slider_styles={horiz:1,vert:1,bar:1,compact:1}
export const slider_normalize=(self,n)=>{const i=getpair(ifield(self,'interval')),s=ln(ifield(self,'step'));return clamp(i.x,Math.round(n/s)*s,i.y)}
export const slider_read=(x,card)=>{
	const update=self=>iwrite(self,lms('value'),ifield(self,'value'))
	const ri=lmi((self,i,x)=>{
		if(!is_rooted(self))return NONE
		if(x){
			if(ikey(i,'value'   ))return self.value=slider_normalize(self,ln(x)),x
			if(ikey(i,'step'    ))return self.step=max(0.000001,ln(x)),update(self),x
			if(ikey(i,'format'  ))return self.format=ls(x),x
			if(ikey(i,'style'   ))return self.style=normalize_enum(slider_styles,ls(x)),x
			if(ikey(i,'interval')){const v=getpair(x);return self.interval=rect(min(v.x,v.y),max(v.x,v.y)),update(self),x}
		}else{
			if(ikey(i,'value'   )){const v=getpair(ifield(self,'interval'));return value_inherit(self,ls(i))||lmn(clamp(v.x,0,v.y))}
			if(ikey(i,'format'  ))return lms(ivalue(self,ls(i),'%f'))
			if(ikey(i,'step'    ))return lmn(ivalue(self,ls(i),1))
			if(ikey(i,'interval'))return lmpair(ivalue(self,ls(i),rect(0,100)))
			if(ikey(i,'style'   ))return lms(ivalue(self,ls(i),'horiz'))
			if(ikey(i,'size'    ))return lmpair(ivalue(self,ls(i),rect(100,25)))
		}return interface_widget(self,i,x)
	},'slider');ri.card=card
	init_field(ri,'interval',x)
	init_field(ri,'step'    ,x)
	init_field(ri,'value'   ,x)
	init_field(ri,'format'  ,x)
	init_field(ri,'style'   ,x)
	return ri
}
export const slider_write=x=>{
	const r=lmd([lms('type')],[lms('slider')])
	if(x.interval)dset(r,lms('interval'),lmpair(x.interval))
	if(x.value!=undefined&&x.value!=0&&!x.volatile)dset(r,lms('value'),lmn(x.value))
	if(x.step!=undefined&&x.step!=1)dset(r,lms('step'),lmn(x.step))
	if(x.format!=undefined&&x.format!='%f')dset(r,lms('format'),lms(x.format))
	if(x.style&&x.style!='horiz')dset(r,lms('style'),lms(x.style))
	return r
}
export const grid_scrollto=(t,g,s,r)=>{
	const head=g.headers?10+5:0, row=g.font?font_h(g.font):11, n=min(count(t),0|((g.size.h-head+1)/(row+5)));
	return (r-s<0)?r: (r-s>=n)?r-(n-1): s
}
export const grid_read=(x,card)=>{
	const ints=(x,n)=>{const r=[];for(let z=0;z<n&&z<x.length;z++)r.push(ln(x[z]));return r}
	const ri=lmi((self,i,x)=>{
		if(!is_rooted(self))return NONE
		if(x){
			if(ikey(i,'value'    ))return self.value=lt(x),x
			if(ikey(i,'scroll'   ))return self.scroll=max(0,ln(x)),x
			if(ikey(i,'row'      ))return self.row=max(-1,ln(x)),x
			if(ikey(i,'col'      ))return (!lin(x)?iwrite(self,lms('colname'),x): self.col=max(-1,ln(x))),x
			if(ikey(i,'colname'  ))return iwrite(self,lms('col'),lmn(tab_cols(ifield(self,'value')).indexOf(ls(x)))),x
			if(ikey(i,'cell'     ))return iwrite(self,lms('col'),l_at(x,NONE)),iwrite(self,lms('row'),l_at(x,ONE)),x
			if(ikey(i,'scrollbar'))return self.scrollbar=lb(x),x
			if(ikey(i,'headers'  ))return self.headers=lb(x),x
			if(ikey(i,'lines'    ))return self.lines=lb(x),x
			if(ikey(i,'bycell'   ))return self.bycell=lb(x),x
			if(ikey(i,'widths'   ))return self.widths=ints(ll(x),255),x
			if(ikey(i,'format'   ))return self.format=ls(x),x
			if(ikey(i,'rowvalue' ))return iwrite(self,lms('value'   ),amend(ifield(self,'value'   ),ifield(self,'row'    ),x)),x
			if(ikey(i,'cellvalue'))return iwrite(self,lms('rowvalue'),amend(ifield(self,'rowvalue'),ifield(self,'colname'),x)),x
		}else{
			if(ikey(i,'value'    ))return value_inherit(self,ls(i))||lmt()
			if(ikey(i,'scroll'   ))return value_inherit(self,ls(i))||NONE
			if(ikey(i,'scrollbar'))return lmn(ivalue(self,ls(i),1))
			if(ikey(i,'headers'  ))return lmn(ivalue(self,ls(i),1))
			if(ikey(i,'lines'    ))return lmn(ivalue(self,ls(i),1))
			if(ikey(i,'bycell'   ))return lmn(ivalue(self,ls(i),0))
			if(ikey(i,'widths'   ))return lml((ivalue(self,ls(i),[])).map(lmn))
			if(ikey(i,'format'   ))return lms(ivalue(self,ls(i),''))
			if(ikey(i,'size'     ))return lmpair(ivalue(self,ls(i),rect(100,50)))
			if(ikey(i,'cell'     ))return lml([ifield(self,'col'),ifield(self,'row')])
			if(ikey(i,'row'      )){const r=value_inherit(self,ls(i))||lmn(-1);return lmn(clamp(-1,ln(r),count(ifield(self,'value'))-1))}
			if(ikey(i,'col'      )){const c=value_inherit(self,ls(i))||lmn(-1);return lmn(clamp(-1,ln(c),count(monad.keys(ifield(self,'value')))-1))}
			if(ikey(i,'colname'  )){const c=ln(ifield(self,'col'));k=tab_cols(ifield(self,'value'));return c<0||c>=k.length?NONE: lms(k[c])}
			if(ikey(i,'rowvalue' )){const r=ln(ifield(self,'row')),v=ifield(self,'value');return r<0||r>=count(v)?lmd():l_at(v,lmn(r))}
			if(ikey(i,'cellvalue')){
				const r=ln(ifield(self,'row')),c=ln(ifield(self,'col')),v=ifield(self,'value'),cn=tab_cols(v);
				return r<0||c<0||r>=count(v)||c>=tab_cols(v).length?NONE: tab_cell(v,cn[c],r)
			}
			if(ikey(i,'scrollto'))return lmnat(z=>{
				const sz=rpair(getpair(ifield(self,'pos')),getpair(ifield(self,'size'))), s=ln(ifield(self,'scroll'))
				const g={size:sz,font:ifield(self,'font'),headers:lb(ifield(self,'headers'))}
				const t=grid_scrollto(ifield(self,'value'),g,s,ln(z.length?z[0]:NONE))
				if(t!=s)iwrite(self,lms('scroll'),lmn(t));return self
			})
		}return interface_widget(self,i,x)
	},'grid');ri.card=card
	init_field(ri,'scrollbar',x)
	init_field(ri,'headers'  ,x)
	init_field(ri,'lines'    ,x)
	init_field(ri,'bycell'   ,x)
	init_field(ri,'widths'   ,x)
	init_field(ri,'format'   ,x)
	init_field(ri,'scroll'   ,x)
	init_field(ri,'row'      ,x)
	init_field(ri,'col'      ,x)
	{const k=lms('value'),v=dget(x,k);if(v)iwrite(ri,k,monad.table(v))}
	return ri
}
export const grid_write=x=>{
	const r=lmd([lms('type')],[lms('grid')])
	if(x.scrollbar!=undefined)dset(r,lms('scrollbar'),lmn(x.scrollbar))
	if(x.headers!=undefined)dset(r,lms('headers'),lmn(x.headers))
	if(x.lines!=undefined)dset(r,lms('lines'),lmn(x.lines))
	if(x.bycell!=undefined)dset(r,lms('bycell'),lmn(x.bycell))
	if(x.widths)dset(r,lms('widths'),lml(x.widths.map(lmn)))
	if(x.format)dset(r,lms('format'),lms(x.format))
	if(x.value &&!x.volatile)dset(r,lms('value'),monad.cols(x.value))
	if(x.scroll&&!x.volatile)dset(r,lms('scroll'),lmn(x.scroll))
	if(x.row!=undefined&&x.row!=-1&&!x.volatile)dset(r,lms('row'),lmn(x.row))
	if(x.col!=undefined&&x.col!=-1&&!x.volatile)dset(r,lms('col'),lmn(x.col))
	return r
}
export const canvas_clip=(canvas,z)=>{
	const i=container_image(canvas,1),s=i.size,w=rect(0,0,s.x,s.y);canvas.clip=!z||z.length<1?w:rint(rclip(w,unpack_rect(z,w)))
}
export const canvas_pick=canvas=>{
	container_image(canvas,1)
	if(!canvas.brush  )iwrite(canvas,lms('brush'  ),ifield(canvas,'brush'  ))
	if(!canvas.pattern)iwrite(canvas,lms('pattern'),ifield(canvas,'pattern'))
	if(!canvas.font   )iwrite(canvas,lms('font'   ),ifield(canvas,'font'   ))
	if(!canvas.clip   )canvas_clip(canvas)
	frame=canvas
}
export const container_image=(canvas,build)=>{
	if(canvas.image||!build)return canvas.image
	const i=canvas.image,scale=!canvas_is(canvas)?1.0:ln(ifield(canvas,'scale')),size=getpair(ifield(canvas,'size'))
	canvas.image=i?image_copy(i):image_make(rect(ceil(size.x/scale),ceil(size.y/scale))),canvas_clip(canvas);return canvas.image
}
export const canvas_resize=(canvas,size)=>{
	if(!canvas.image)return
	const scale=ln(ifield(canvas,'scale'));image_resize(canvas.image,rect(ceil(size.x/scale),ceil(size.y/scale))),canvas_clip(canvas)
}
export const canvas_read=(x,card)=>{
	const wid_pal=x=>x.card.deck.patterns.pal.pix
	const wid_rect=(x,z)=>rint(unpack_rect(z,container_image(x).size))
	const wid_crect=(x,z)=>rint(rclip(unpack_rect(z,container_image(x).size),frame.clip))
	const text=(t,pos,a)=>{
		const font=ifield(frame,'font')
		if(pos&&lil(pos)&&count(pos)>=4){
			a=anchors[ls(a)]||0;const r=rint(getrect(pos)), align=(a==0||a==3||a==6)?ALIGN.left:(a==2||a==5||a==8)?ALIGN.right:ALIGN.center
			const valign=s=>rect(align==ALIGN.left?0:align==ALIGN.right?r.w-s.x:0|((r.w-s.x)/2), y=(a==0||a==1||a==2)?0:(a==6||a==7||a==8)?r.h-s.y:0|((r.h-s.y)/2))
			const rbox=s=>{const a=valign(s);return rclip(rint(rect(r.x+a.x,r.y+a.y,s.x,s.y)),frame.clip)}
			if(lit(t)){const l=layout_richtext(frame.card.deck,t,font,align,r.w);draw_text_rich(rbox(l.size),l,frame.pattern,0)}
			else      {const l=layout_plaintext(ls(t),font,align,rect(r.w,r.h)) ;draw_text_wrap(rbox(l.size),l,frame.pattern  )}
		}else{
			if(lit(t)){const p=getpair(pos);return text(t,lml([p.x,p.y,RTEXT_END/1000,RTEXT_END].map(lmn)))}
			const p=anchor(rpair(getpair(pos),font_textsize(font,ls(t))),a)
			draw_text(p,ls(t),font,frame.pattern)
		}return NONE
	}
	const ri=lmi((self,i,x)=>{
		if(!is_rooted(self))return NONE
		if(x){
			if(ikey(i,'brush'    )){let n=0|max(0,ln(x));if(lis(x)){const v=dkix(self.card.deck.brushes,x);if(v!=-1)n=24+v};return self.brush=n,x}
			if(ikey(i,'pattern'  ))return self.pattern=0|clamp(0,ln(x),255),x
			if(ikey(i,'font'     ))return self.font=normalize_font(self.card.deck.fonts,x),x
			if(!lis(i)){const img=container_image(self,1);return img.f(img,i,x)}
			if(self.free)return x
			if(ikey(i,'border'   ))return self.border=lb(x),x
			if(ikey(i,'draggable'))return self.draggable=lb(x),x
			if(ikey(i,'lsize'    )){i=lms('size'),x=lmpair(rmul(getpair(x),ln(ifield(self,'scale'))))}
			if(ikey(i,'size'     )){canvas_resize(self,getpair(x))}
			if(ikey(i,'scale'    )){return self.scale=max(0.1,ln(x)),canvas_resize(self,getpair(ifield(self,'size'))),x}
		}else{
			if(!lis(i)){const img=container_image(self,0);return img?img.f(img,i,x):NONE}
			if(ikey(i,'border'   ))return lmn(ivalue(self,ls(i),1))
			if(ikey(i,'draggable'))return lmn(ivalue(self,ls(i),0))
			if(ikey(i,'brush'    ))return lmn(ivalue(self,ls(i),0))
			if(ikey(i,'pattern'  ))return lmn(ivalue(self,ls(i),1))
			if(ikey(i,'size'     ))return lmpair(ivalue(self,ls(i),rect(100,100)))
			if(ikey(i,'scale'    ))return lmn(ivalue(self,ls(i),1.0))
			if(ikey(i,'lsize'    )){const s=getpair(ifield(self,'size')),z=ln(ifield(self,'scale'));return lmpair(rect(ceil(s.x/z),ceil(s.y/z)))}
			if(ikey(i,'clip'     ))return lmnat(z=>(canvas_clip(self,z),NONE))
			if(ikey(i,'clear'    ))return lmnat(z=>(canvas_pick(self),draw_rect(wid_crect(self,z),0            )                          ,NONE))
			if(ikey(i,'rect'     ))return lmnat(z=>(canvas_pick(self),draw_rect(wid_crect(self,z),frame.pattern)                          ,NONE))
			if(ikey(i,'invert'   ))return lmnat(z=>(canvas_pick(self),draw_invert_raw(wid_pal(self),wid_crect(self,z))                    ,NONE))
			if(ikey(i,'box'      ))return lmnat(z=>(canvas_pick(self),draw_boxf(wid_rect(self,z),frame.brush,frame.pattern,self.card.deck),NONE))
			if(ikey(i,'poly'     ))return lmnat(z=>(canvas_pick(self),draw_poly(unpack_poly(z),frame.pattern)                             ,NONE))
			if(ikey(i,'line'     ))return lmnat(z=>(canvas_pick(self),draw_lines(unpack_poly(z),frame.brush,frame.pattern,self.card.deck) ,NONE))
			if(ikey(i,'fill'     ))return lmnat(([pos])=>(canvas_pick(self),draw_fill(rint(getpair(pos)),self.pattern)                    ,NONE))
			if(ikey(i,'copy'     ))return lmnat(z=>{const img=container_image(self,1);return image_copy(img,unpack_rect(z,img.size))})
			if(ikey(i,'paste'    ))return lmnat(([img,pos,t])=>{
				canvas_pick(self);const dst=container_image(self,1)
				img=getimage(img),pos=(pos?ll(pos):[]).map(ln); let solid=t?!lb(t):1
				image_paste_scaled(pos.length<=2?rect(pos[0],pos[1],img.size.x,img.size.y):rect(pos[0],pos[1],pos[2],pos[3]),frame.clip,img,dst,solid)
				return NONE
			})
			if(ikey(i,'merge'))return lmnat(z=>{
				canvas_pick(self)
				if(lis(z[0])){if(image_is(z[1]))image_merge_op(frame.image,z[1],ls(z[0])[0]);return NONE}
				if(lil(z[0]))z=ll(z[0]);const nice=x=>x&&image_is(x)&&x.size.x>0&&x.size.y>0, s=frame.image.size
				const v=new Uint8Array(256),sx=new Uint32Array(256),sy=new Uint32Array(256)
				for(let p=0;p<z.length&&p<256;p++)if(nice(z[p]))v[p]=1,sx[p]=z[p].size.x,sy[p]=z[p].size.y
				for(let y=0;y<s.y;y++)for(let x=0;x<s.x;x++){const h=rect(x,y);if(inclip(h)){const p=gpix(h),c=v[p]?z[p].pix[(x%sx[p])+(y%sy[p])*sx[p]]:0;pix(h,c)}}
				return NONE
			})
			if(ikey(i,'segment'))return lmnat(([img,x,y])=>{
				canvas_pick(self);if(!image_is(img))return NONE;const r=rint(getrect(x)),m=normalize_margin(y,img.size)
				r.w=max(r.w,m.x+m.w),r.h=max(r.h,m.y+m.h),draw_9seg(r,frame.image,img,m,frame.clip,0,null);return NONE
			})
			if(ikey(i,'text'))return lmnat(([x,pos,a])=>(canvas_pick(self),text(x=lit(x)?rtext_cast(x):lms(ls(x)),pos,a)))
			if(ikey(i,'textsize'))return lmnat(([x,wid])=>{
				const l=layout_richtext(self.card.deck,rtext_cast(x||lms('')),ifield(self,'font'),ALIGN.left,wid?ln(wid):RTEXT_END)
				if(!wid)l.size.x=l.lines.reduce((x,y)=>max(x,y.pos.x+y.pos.w),0);return lmpair(l.size)
			})
		}return interface_widget(self,i,x)
	},'canvas');ri.card=card
	ri.card=card
	{const v=dget(x,lms('image'));if(v)ri.image=image_read(ls(v)),iwrite(ri,lms('size'),lmpair(ri.image.size))}
	{const v=dget(x,lms('clip' ));if(v)canvas_clip(ri,ll(v))}
	{const v=dget(x,lms('size' ));if(v)ri.size=getpair(v)}
	{const v=dget(x,lms('scale'));if(v)ri.scale=max(0.1,ln(v))}
	init_field(ri,'border'   ,x)
	init_field(ri,'draggable',x)
	init_field(ri,'brush'    ,x)
	init_field(ri,'pattern'  ,x)
	init_field(ri,'font'     ,x)
	return ri
}
export const canvas_write=x=>{
	const r=lmd([lms('type')],[lms('canvas')])
	if(x.border!=undefined)dset(r,lms('border'),lmn(x.border))
	if(x.image&&!is_blank(x.image)&&!x.volatile)dset(r,lms('image'),lms(image_write(x.image)))
	if(x.draggable)dset(r,lms('draggable'),lmn(x.draggable))
	if(x.brush    )dset(r,lms('brush'    ),lmn(x.brush))
	if(x.pattern!=undefined&&x.pattern!=1)dset(r,lms('pattern'),lmn(x.pattern))
	if(x.scale)dset(r,lms('scale'),lmn(x.scale))
	if(x.clip&&!requ(x.clip,rpair(rect(),getpair(ifield(x,'lsize')))))dset(r,lms('clip'),lml([x.clip.x,x.clip.y,x.clip.w,x.clip.h].map(lmn)))
	return r
}
export const contraption_read=(x,card)=>{
	x=ld(x);const dname=dget(x,lms('def')), def=dname?dget(card.deck.contraptions,dname):null;if(!def)return null
	const corner_reflow=(p,s,m,d)=>rect(
		(p.x<m.x)?p.x: (p.x>s.x-m.w)?d.x-(s.x-p.x): s.x==0?0:Math.round((p.x/s.x)*d.x), // left | right  | stretch horiz
		(p.y<m.y)?p.y: (p.y>s.y-m.h)?d.y-(s.y-p.y): s.y==0?0:Math.round((p.y/s.y)*d.y)  // top  | bottom | stretch vert
	)
	const reflow=c=>{
		const def=c.def, swids=def.widgets, dwids=c.widgets, m=def.margin, s=def.size, d=getpair(ifield(c,'size'))
		swids.k.map((k,i)=>{
			const swid=swids.v[i],dwid=dget(dwids,k);if(!dwid)return
			let a=getpair(ifield(swid,'pos')), b=radd(getpair(ifield(swid,'size')),a)
			a=corner_reflow(a,s,m,d), b=corner_reflow(b,s,m,d)
			iwrite(dwid,lms('pos'),lmpair(a)),iwrite(dwid,lms('size'),lmpair(rsub(b,a)))
		})
	}
	const masks={name:1,index:1,image:1,script:1,locked:1,animated:1,volatile:1,pos:1,show:1,font:1,toggle:1,event:1,offset:1,parent:1}
	const ri=lmi((self,i,x)=>{
		if(!is_rooted(self))return NONE
		if(x){
			if(ikey(i,'def'  ))return x // not mutable!
			if(ikey(i,'image'))return x // not mutable!
			if(ikey(i,'size' )){
				const m=self.def.margin
				return self.size=rmax(rect(m.x+m.w,m.y+m.h),getpair(x)),reflow(self),x
			}
			if(lis(i)&&masks.hasOwnProperty(ls(i)))return interface_widget(self,i,x)
			return fire_attr_sync(self,'set_'+ls(i),x),x
		}else{
			if(ikey(i,'def'  ))return self.def
			if(ikey(i,'size' ))return lmpair((def.resizable?self.size:def.size)||def.size)
			if(ikey(i,'image'))return ifield(self.def,'image')
			if(lis(i)&&masks.hasOwnProperty(ls(i)))return interface_widget(self,i,x)
			return fire_attr_sync(self,'get_'+ls(i),null)
		}
	},'contraption')
	ri.card   =card
	ri.deck   =card.deck
	ri.def    =def
	ri.widgets=lmd()
	let w=dget(x,lms('widgets')),d=def.widgets;if(w){w=ld(w)}else{w=lmd();def.widgets.k.map(k=>dset(w,k,lmd()))}
	d.k.map((k,i)=>{const a=widget_write(d.v[i]),o=dget(w,k);widget_add(ri,o?dyad[','](a,o):a)})
	{const k=lms('size'),v=dget(x,k);iwrite(ri,k,v?v:ifield(def,'size'))}
	{ri.viewproxy=lmi(interface_widget,'proxy'),ri.viewproxy.card=ri}
	return ri
}
export const contraption_write=x=>{
	const wids=lmd(), r=lmd(['type','def','widgets'].map(lms),[lms('contraption'),ifield(x.def,'name'),wids])
	const dict_delta=(a,b)=>{const r=lmd();b.k.map((k,i)=>{const av=dget(a,k),bv=b.v[i];if(!av||!match(av,bv))dset(r,k,bv)});return r}
	x.widgets.v.map(w=>{
		let wid=widget_write(w), n=ifield(w,'name'), src=dget(x.def.widgets,n)
		dset(wids,n,dyad.drop(lms('name'),src?dict_delta(widget_write(src),wid):wid))
	});return r
}
export const widget_shows={solid:1,invert:1,transparent:1,none:1}
export const interface_widget=(self,i,x)=>{
	widget_rename=(card,a,b)=>{const w=card.widgets,i=dkix(w,a);w.k[i]=b,w.v[i].name=ls(b)}
	if(x){
		if(ikey(i,'name'    ))return widget_rename(self.card,lms(self.name),ukey(self.card.widgets,lms(ls(x)),ls(x),lms(self.name))),x
		if(ikey(i,'index'   ))return reorder(self.card.widgets,dvix(self.card.widgets,self),ln(x)),x
		if(ikey(i,'font'    ))return self.font=normalize_font(self.card.deck.fonts,x),x
		if(ikey(i,'script'  ))return self.script=ls(x),x
		if(ikey(i,'locked'  ))return self.locked=lb(x),x
		if(ikey(i,'animated'))return self.animated=lb(x),x
		if(ikey(i,'volatile'))return self.volatile=lb(x),x
		if(ikey(i,'size'    ))return self.size=rint(rclamp(rect(),getpair(x),rect(4096,4096))),x
		if(ikey(i,'pos'     ))return self.pos=rint(getpair(x)),x
		if(ikey(i,'show'    ))return self.show=normalize_enum(widget_shows,ls(x)),x
	}else{
		if(ikey(i,'name'    ))return lms(self.name)
		if(ikey(i,'index'   ))return lmn(dvix(self.card.widgets,self))
		if(ikey(i,'script'  ))return lms(ivalue(self,ls(i),''))
		if(ikey(i,'locked'  ))return lmn(ivalue(self,ls(i),0))
		if(ikey(i,'animated'))return lmn(ivalue(self,ls(i),0))
		if(ikey(i,'volatile'))return lmn(ivalue(self,ls(i),0))
		if(ikey(i,'pos'     ))return lmpair(ivalue(self,ls(i),rect()))
		if(ikey(i,'show'    ))return lms(ivalue(self,ls(i),'solid'))
		if(ikey(i,'font'    ))return dget(self.card.deck.fonts,lms(ivalue(self,ls(i),button_is(self)?'menu':'body')))
		if(ikey(i,'event'   ))return lmnat(args=>n_event(self,args))
		if(ikey(i,'parent'  ))return self.card
		if(ikey(i,'toggle'  ))return lmnat(([s,v])=>{
			const a=v==undefined;s=s||lms('solid'),v=v||NONE;const o=ifield(self,'show'),n=lms('none')
			const r=(a?match(o,n):(lb(v)&&!match(v,n)))?s:n;iwrite(self,lms('show'),r);return r
		})
		if(ikey(i,'offset')){
			let c=getpair(ifield(self.card,'size')), p=getpair(ifield(self,'pos')), d=self.card.deck.size, con=self.card
			while(contraption_is(con)){p=radd(p,getpair(ifield(con,'pos'))),con=con.card,c=getpair(ifield(con,'size'))}
			return lmpair(radd(p,rcenter(rect(0,0,d.x,d.y),c)))
		}
	}return x?x:NONE
}
export const widget_read=(x,card)=>{
	const type=ls(dget(x,lms('type'))||lms('button')), tname=type=='contraption'?ls(dget(x,lms('def'))||lms(type)):type
	const ctors={button:button_read,field:field_read,slider:slider_read,grid:grid_read,canvas:canvas_read,contraption:contraption_read}
	const ri=(ctors[type]||button_read)(ld(x),card);if(!lii(ri))return null
	ri.name=ls(ukey(card.widgets,dget(x,lms('name')),tname))
	init_field(ri,'size'    ,x)
	init_field(ri,'script'  ,x)
	init_field(ri,'font'    ,x)
	init_field(ri,'locked'  ,x)
	init_field(ri,'animated',x)
	init_field(ri,'volatile',x)
	init_field(ri,'pos'     ,x)
	init_field(ri,'show'    ,x)
	return ri
}
export const widget_write=x=>{
	const r=lmd()
	dset(r,lms('name'),lms(x.name))
	dset(r,lms('type'),lms(x.n))
	dset(r,lms('size'),ifield(x,'size'))
	dset(r,lms('pos' ),ifield(x,'pos' ))
	if(x.size    )dset(r,lms('size'    ),lmpair(x.size))
	if(x.pos     )dset(r,lms('pos'     ),lmpair(x.pos))
	if(x.locked  )dset(r,lms('locked'  ),lmn(x.locked))
	if(x.animated)dset(r,lms('animated'),lmn(x.animated))
	if(x.volatile)dset(r,lms('volatile'),lmn(x.volatile))
	if(x.script  )dset(r,lms('script'  ),lms(x.script))
	if(x.font&&x.font!=(button_is(x)?"menu":"body"))dset(r,lms('font'),lms(x.font))
	if(x.show&&x.show!='solid')dset(r,lms('show'),lms(x.show))
	return dyad[','](r,button_is(x)?button_write(x): field_is (x)?field_write (x):slider_is(x)?slider_write(x):
	                   grid_is  (x)?grid_write  (x): canvas_is(x)?canvas_write(x):contraption_is(x)?contraption_write(x): lmd())
}

export const widget_strip=x=>dyad.take(lml([lms('name'),lms('type')]),x)
export const widget_add=(card,x)=>{const r=widget_read(x,card);if(lii(r))dset(card.widgets,ifield(r,'name'),r);return r}
export const card_add=(card,type,name,n2)=>{
	if(prototype_is(card)&&(contraption_is(type)||ls(type)=='contraption'))return NONE
	if(lis(type)){
		if(ls(type)=='contraption'){
			const defs=card.deck.contraptions, ct=lms(name?ls(name):''), def=dget(defs,ct);if(!def)return NONE
			const a=lmd(['type','def'].map(lms),[lms('contraption'),ct]);if(n2)dset(a,lms('name'),lms(ls(n2)));return widget_add(card,a)
		}
		if(!ls(type)in{button:1,field:1,slider:1,canvas:1,grid:1})return NONE
		const a=lmd([lms('type')],[type]);if(name)dset(a,lms('name'),lms(ls(name)));return widget_add(card,a)
	}
	if(widget_is(type)){const a=widget_write(type);if(name)dset(a,lms('name'),name);return widget_add(card,a)}
	return NONE
}
export const card_remove=(card,x)=>{
	if(lil(x)||lid(x))return x.v.reduce((x,y)=>x&card_remove(card,y),1)
	if(!widget_is(x)||!dkey(card.widgets,x))return 0
	const name=ifield(x,'name');dget(card.widgets,name).dead=true,card.widgets=dyad.drop(name,card.widgets);return 1
}
export const con_copy_raw=(card,z)=>z.filter(w=>widget_is(w)&&w.card==card).map(widget_write)
export const con_paste_raw=(card,payload)=>payload.map(p=>widget_add(card,ld(p)))
export const find_fonts=(deck,target,widgets)=>{
	let fonts=lmd([],[]);widgets.filter(widget_is).map(wid=>{
		if(wid.font)dset(fonts,lms(wid.font),dget(deck.fonts,lms(wid.font))) // directly on widgets
		if(contraption_is(wid)){ // inside contraption instances
			wid.widgets.v.map(w=>ifield(w,'font')).map(f=>dset(fonts,dkey(deck.fonts,f),f))
		}
		if(field_is(wid)&&match(ifield(wid,'style'),lms('rich'))){ // inside rtext field values
			tab_get(ifield(wid,'value'),'font').filter(n=>count(n)&&!dget(fonts,n)).map(n=>dset(fonts,n,dget(deck.fonts,n)))
		}
	})
	fonts=dyad.drop(lml(['body','menu','mono'].map(lms)),fonts),fonts.v.map((x,i)=>{fonts.v[i]=lms(font_write(x))})
	if(count(fonts))dset(target,lms('f'),fonts)
}
export const merge_fonts=(deck,f)=>{
	if(!f)return;f=ld(f)
	f.v.map((x,i)=>{const k=f.k[i],v=font_read(ls(x));if(font_is(v)&&!dget(deck.fonts,k))dset(deck.fonts,k,v)})
}
export const con_copy=(card,z)=>{
	z=lil(z)||lid(z)?ll(z):[z];
	const wids=lml(con_copy_raw(card,z)),defs=lmd(),v=lmd(['w','d'].map(lms),[wids,defs])
	const condefs=card.deck.contraptions;find_fonts(card.deck,v,z),wids.v.map(wid=>{
		const type=dget(wid,lms('type')),def=dget(wid,lms('def'))
		if(ls(type)=='contraption'&&dget(defs,def)==null)dset(defs,def,prototype_write(dget(condefs,def)))
	});return lms(`%%WGT0${fjson(v)}`)
}
export const merge_prototypes=(deck,defs,uses)=>{
	const condefs=deck.contraptions;defs.v.map(def=>{
		const name=dget(def,lms('name'));let desc=dget(def,lms('description'));if(!lis(name))return;if(!desc)desc=lms('')
		const ver=dget(def,lms('version')),version=ver?ln(ver):0.0
		if(condefs.v.some(con=>{
			const r=match(name,ifield(con,'name'))&&match(desc,ifield(con,'description'))
			if(r&&ln(ifield(con,'version'))<version)deck_add(deck,prototype_read(def,deck_read('')))
			return r
		}))return
		const p=prototype_read(def,deck),nn=ifield(p,'name');dset(condefs,nn,p)
		uses.map(wid=>{
			const type=dget(wid,lms('type')),def=dget(wid,lms('def'))
			if(lis(type)&&ls(type)=='contraption'&&lis(def)&&ls(def)==ls(name))dset(wid,lms('def'),nn)
		})
	})
}
export const con_paste=(card,z)=>{
	if(!lis(z)||!z.v.startsWith('%%WGT0'))return NONE
	const v=ld(pjson(ls(z),6,count(z)-6).value),defs=dget(v,lms('d'));let wids=dget(v,lms('w'));wids=wids?ll(wids):[]
	merge_fonts(card.deck,dget(v,lms('f'))),merge_prototypes(card.deck,defs?ld(defs):lmd(),wids);return lml(con_paste_raw(card,wids))
}
export const card_read=(x,deck,cdata)=>{
	x=ld(x);const nav_dirs={right:1,left:1,up:1,down:1},ri=lmi((self,i,x)=>{
		if(self.dead)return NONE
		if(x){
			if(ikey(i,'name')){
				if(ls(x).length==0)return x;const n=ukey(deck.cards,lms(ls(x)),ls(x),lms(self.name))
				deck.cards.k[dvix(deck.cards,self)]=n,self.name=ls(n);return x
			}
			if(ikey(i,'script'))return self.script=ls(x),x
			if(ikey(i,'image' ))return self.image=image_is(x)?x:image_make(rect()),x
			if(ikey(i,'index'))return reorder(self.deck.cards,dvix(self.deck.cards,self),ln(x)),self.deck.history=[ln(ifield(self,'index'))],x
		}else{
			if(ikey(i,'name'   ))return lms(self.name)
			if(ikey(i,'size'   ))return lmpair(deck.size)
			if(ikey(i,'index'  ))return lmn(dvix(deck.cards,self))
			if(ikey(i,'script' ))return lms(self.script||'')
			if(ikey(i,'widgets'))return self.widgets
			if(ikey(i,'parent' ))return self.deck
			if(ikey(i,'image'  ))return self.image
			if(ikey(i,'add'    ))return lmnat(([t,n1,n2])=>card_add(self,t,n1,n2))
			if(ikey(i,'remove' ))return lmnat(([x])=>lmn(card_remove(self,x)))
			if(ikey(i,'event'  ))return lmnat(args=>n_event(self,args))
			if(ikey(i,'copy'   ))return lmnat(([z])=>con_copy(self,z))
			if(ikey(i,'paste'  ))return lmnat(([z])=>con_paste(self,z))
		}return x?x:NONE
	},'card')
	const n=dget(x,lms('name'))
	ri.deck=deck
	ri.widgets=lmd()
	ri.name=ls(ukey(deck.cards,n&&lis(n)&&count(n)==0?null:n,'card'))
	ri.script=ls(dget(x,lms('script'))||lms(''))
	{const v=dget(x,lms('image'));ri.image=v?image_read(ls(v)):image_make(deck.size)}
	ll(dget(x,lms('widgets'))||lml([])).filter(w=>dget(w,lms('name'))).map(w=>{const i=widget_read(w,ri);if(lii(i))dset(ri.widgets,ifield(i,'name'),i)})
	return ri
}
export const card_write=card=>{
	const r=lmd(),wids=lmd()
	dset(r,lms('name'),lms(card.name)),dset(r,lms('widgets'),wids)
	if(card.script.length)dset(r,lms('script'),lms(card.script))
	if(card.image&&!is_blank(card.image))dset(r,lms('image'),lms(image_write(card.image)))
	card.widgets.k.map((k,i)=>{
		let wid=widget_write(card.widgets.v[i]),n=dget(wid,lms('name'))
		wid=dyad.drop(lms('name'),wid)
		if(count(wid))dset(wids,n,wid)
	});return r
}
export const contraption_update=(deck,def)=>{
	const contraption_strip=x=>{
		const r=lmd();x.widgets.v.map(w=>{
			let p=widget_write(w)
			if(button_is(w))p=dyad.take(lms('value'),p)
			if(slider_is(w))p=dyad.take(lms('value'),p)
			if(field_is (w))p=dyad.take(lml(['value','scroll'].map(lms)),p)
			if(grid_is  (w))p=dyad.take(lml(['value','scroll','row','col'].map(lms)),p)
			if(canvas_is(w))p=dyad.take(lms('image'),p)
			dset(r,ifield(w,'name'),p)
		});return r
	}
	deck.cards.v.map(card=>{
		card.widgets.v.filter(x=>contraption_is(x)&&x.def==def).map(widget=>{
			const d=widget_write(widget), n=widget.name
			dset(d,lms('widgets'),contraption_strip(widget))
			for(var k in widget)delete widget[k];Object.assign(widget,widget_read(d,card));widget.name=n
		})
	})
}
export const normalize_margin=(x,s)=>{
	const m=rint(getrect(x))
	return rmax(rect(min(m.x,s.x),min(m.y,s.y),min(m.w,s.x-m.x),min(m.h,s.y-m.y)),rect(0,0,0,0))
}
export const prototype_read=(x,deck)=>{
	x=ld(x)
	const attribute_types={'':1,bool:1,number:1,string:1,code:1,rich:1}
	const normalize_attributes=x=>{
		const r=lmt();tab_set(r,'name',[]),tab_set(r,'label',[]),tab_set(r,'type',[]);if(!lit(x))return r
		const sn=tab_get(x,'name'),sl=tab_get(x,'label')||sn,st=tab_get(x,'type')
		if(sn&&st)sn.filter(n=>lis(n)&&count(n)).map((n,i)=>{
			const type=normalize_enum(attribute_types,ls(st[i]))
			if(type.length)tab_get(r,'name').push(n),tab_get(r,'label').push(lms(ls(sl[i]))),tab_get(r,'type').push(lms(type))
		});return r
	}
	const prototype_pos=self=>lmpair(rcenter(rect(0,0,deck.size.x,deck.size.y),self.size))
	const ri=lmi((self,i,x)=>{
		if(self.dead)return NONE
		if(x){
			if(ikey(i,'name')){
				const defs=self.deck.contraptions, o=self.name, n=ukey(defs,lms(ls(x)),ls(x),lms(o))
				defs.k[dvix(defs,self)]=n,self.name=ls(n);return x
			}
			if(ikey(i,'description'))return self.description=ls(x),x
			if(ikey(i,'version'    ))return self.version=ln(x),x
			if(ikey(i,'size'       ))return self.size=rint(getpair(x)),contraption_update(deck,self),x
			if(ikey(i,'margin'     ))return self.margin=normalize_margin(x,getpair(ifield(self,'size'))),contraption_update(deck,self),x
			if(ikey(i,'resizable'  ))return self.resizable=lb(x),contraption_update(deck,self),x
			if(ikey(i,'image'      ))return self.image=image_is(x)?x:image_make(rect(0,0)),x
			if(ikey(i,'script'     ))return self.script=ls(x),x
			if(ikey(i,'template'   ))return self.template=ls(x),x
			if(ikey(i,'attributes' ))return self.attributes=normalize_attributes(x),x
		}else{
			if(ikey(i,'name'       ))return lms(self.name)
			if(ikey(i,'description'))return lms(self.description||'')
			if(ikey(i,'version'    ))return lmn(self.version||0.0)
			if(ikey(i,'script'     ))return lms(self.script||'')
			if(ikey(i,'template'   ))return lms(self.template||'')
			if(ikey(i,'font'       ))return monad.first(self.deck.fonts)
			if(ikey(i,'show'       ))return lms('solid')
			if(ikey(i,'parent'     ))return ifield(self.deck,'card')
			if(ikey(i,'size'       ))return lmpair(self.size)
			if(ikey(i,'margin'     ))return lmrect(self.margin)
			if(ikey(i,'resizable'  ))return lmn(self.resizable)
			if(ikey(i,'image'      ))return self.image
			if(ikey(i,'widgets'    ))return self.widgets
			if(ikey(i,'attributes' ))return self.attributes||normalize_attributes(NONE)
			if(ikey(i,'offset'     ))return prototype_pos(self)
			if(ikey(i,'pos'        ))return prototype_pos(self)
			if(ikey(i,'add'        ))return lmnat(([t,n1,n2])=>{const r=card_add(self,t,n1,n2);if(widget_is(r))contraption_update(deck,self);return r})
			if(ikey(i,'remove'     ))return lmnat(([x])=>{const r=card_remove(self,x);if(lb(r))contraption_update(deck,self);return r})
			if(ikey(i,'update'     ))return lmnat(_=>{contraption_update(deck,self);return NONE})
		}return x?x:NONE
	},'prototype')
	ri.deck   =deck
	ri.widgets=lmd()
	{const v=dget(x,lms('name'      ));ri.name=ls(ukey(deck.contraptions,v&&lis(v)&&count(v)==0?null:v,'prototype'))}
	{const v=dget(x,lms('attributes'));if(v)iwrite(ri,lms('attributes'),monad.table(v))}
	{const v=dget(x,lms('size'      ));ri.size=v?rint(getpair(v)):rect(100,100)}
	{const v=dget(x,lms('image'     ));ri.image=v?image_read(ls(v)):image_make(ri.size)}
	{const v=dget(x,lms('resizable' ));ri.resizable=v?lb(v):0}
	let w=dget(x,lms('widgets'));if(lid(w)){w.v.map((v,i)=>dset(v,lms('name'),w.k[i]))}
	(w?ll(w):[]).map(w=>{const n=dget(w,lms('name'));if(n){const i=widget_read(w,ri);if(lii(i))dset(ri.widgets,ifield(i,'name'),i)}})
	init_field(ri,'description',x)
	init_field(ri,'version'    ,x)
	init_field(ri,'script'     ,x)
	init_field(ri,'template'   ,x)
	ri.margin=normalize_margin(dget(x,lms('margin'))||NONE,getpair(ifield(ri,'size')))
	return ri
}
export const prototype_write=x=>{
	const r=lmd(), wids=lmd(), nice=x=>x&&image_is(x)&&x.size.x>0&&x.size.y>0&&!is_blank(x)
	dset(r,lms('name'),lms(x.name))
	dset(r,lms('size'),ifield(x,'size'))
	if(x.resizable)dset(r,lms('resizable'),ONE)
	dset(r,lms('margin'),ifield(x,'margin'))
	if(x.description&&x.description.length)dset(r,lms('description'),lms(x.description))
	if(x.version    &&x.version!=0.0      )dset(r,lms('version'    ),lmn(x.version    ))
	if(x.script     &&x.script.length     )dset(r,lms('script'     ),lms(x.script     ))
	if(x.template   &&x.template.length   )dset(r,lms('template'   ),lms(x.template   ))
	if(nice(x.image)                      )dset(r,lms('image'      ),lms(image_write(x.image)))
	if(x.attributes                       )dset(r,lms('attributes' ),monad.cols(x.attributes))
	x.widgets.v.map(v=>{
		let wid=widget_write(v),n=dget(wid,lms('name'))
		wid=dyad.drop(lms('name'),wid);if(count(wid))dset(wids,n,wid)
	}),dset(r,lms('widgets'),wids);return r
}
export const rename_sound=(deck,sound,name)=>{
	const sounds=deck.sounds,oldname=dkey(sounds,sound)
	sounds.k[dkix(sounds,oldname)]=ukey(sounds,name,ls(name),oldname)
}
export const deck_add=(deck,type,y,z)=>{
	const unpack_name=x=>x?lms(ls(x)):NONE
	if(font_is(type))return uset(deck.fonts,unpack_name(y),'font',font_read(font_write(type)))
	if(ikey(type,'font'))return uset(deck.fonts,unpack_name(z),'font',font_read(getpair(y)))
	if(sound_is(type))return uset(deck.sounds,unpack_name(y),'sound',sound_read(sound_write(type)))
	if(ikey(type,'sound'))return uset(deck.sounds,unpack_name(z),'sound',sound_read(y?ln(y):0))
	if(module_is(type)){
		if((!y)&&dget(deck.modules,ifield(type,'name'))){
			deck_remove(deck,dget(deck.modules,ifield(type,'name')))
			const r=module_read(module_write(type),deck);
			return dset(deck.modules,ifield(r,'name'),r),r
		}else{
			const a=module_write(type);if(y)dset(a,lms('name'),lms(ls(y)));
			const r=module_read(a,deck);return dset(deck.modules,ifield(r,'name'),r),r
		}
	}
	if(ikey(type,'module')){const a=lmd();if(y)dset(a,lms('name'),lms(ls(y)));const r=module_read(a,deck);return dset(deck.modules,ifield(r,'name'),r),r}
	if(card_is(type))return deck_paste(deck,deck_copy(deck,type),y?lms(ls(y)):null)
	if(ikey(type,'card')){const a=lmd();if(y)dset(a,lms('name'),lms(ls(y)));const r=card_read(a,deck);return dset(deck.cards,ifield(r,'name'),r),r}
	if(prototype_is(type)){
		if((!y)&&dget(deck.contraptions,ifield(type,'name'))){
			const name=ifield(type,'name'),r=dget(deck.contraptions,name)
			for(var k in r)delete r[k];Object.assign(r,prototype_read(prototype_write(type),deck));r.name=ls(name)
			contraption_update(deck,r);return r
		}else{
			const a=prototype_write(type);if(y)dset(a,lms('name'),lms(ls(y)));
			const r=prototype_read(a,deck);return dset(deck.contraptions,ifield(r,'name'),r),r
		}
	}
	if(ikey(type),'contraption'){const a=lmd();if(y)dset(a,lms('name'),lms(ls(y)));const r=prototype_read(a,deck);return dset(deck.contraptions,ifield(r,'name'),r),r}
	return NONE
}
export const deck_remove=(deck,t)=>{
	if(widget_is(t)&&is_rooted(t))return card_remove(t.card,t)
	if(module_is(t)){const k=dkey(deck.modules,t);if(k)return deck.modules=dyad.drop(k,deck.modules),1}
	if(sound_is(t)){const k=dkey(deck.sounds,t);if(k)return deck.sounds=dyad.drop(k,deck.sounds),1}
	if(font_is(t)){
		const k=dkey(deck.fonts,t);if(!k||ls(k)in{body:1,menu:1,mono:1})return 0
		const remove=w=>w.v.map(w=>{if(w.font==ls(k))w.font='body';if(contraption_is(w))remove(w.widgets)})
		deck.cards.v.map(c=>remove(c.widgets))
		deck.contraptions.v.map(c=>remove(c.widgets))
		return deck.fonts=dyad.drop(k,deck.fonts),1
	}
	if(prototype_is(t)){
		const k=dkey(deck.contraptions,t);if(!k)return 0
		deck.cards.v.map(card=>card.widgets.v.filter(w=>contraption_is(w)&&w.def==t).map(w=>card_remove(card,w)))
		return deck.contraptions=dyad.drop(k,deck.contraptions),t.dead=true,1
	}
	if(card_is(t)){
		if(count(deck.cards)<=1)return 0
		deck.cards=dyad.drop(dkey(deck.cards,t)||NONE,deck.cards),t.dead=true
		if(deck.card>=count(deck.cards))deck.card=count(deck.cards-1)
		deck.history=[ln(ifield(ifield(deck,'card'),'index'))]
		return 1
	}return 0
}
export const deck_copy=(deck,z)=>{
	if(!card_is(z))return NONE;const defs=lmd(),v=lmd(['c','d'].map(lms),[card_write(z),defs]);find_fonts(deck,v,z.widgets.v)
	z.widgets.v.filter(contraption_is).map(wid=>{const d=wid.def,n=ifield(d,'name');if(dget(defs,n)==null)dset(defs,n,prototype_write(d))})
	return lms(`%%CRD0${fjson(v)}`)
}
export const deck_paste=(deck,z,name)=>{
	if(!lis(z)||!ls(z).startsWith('%%CRD0'))return NONE
	const v=ld(pjson(ls(z),6,count(z)-6).value);let payload=dget(v,lms('c')),defs=dget(v,lms('d'));payload=payload?ld(payload):lmd()
	const wids=dget(payload,lms('widgets'));if(wids&&lid(wids))wids.v.map((v,i)=>dset(v,lms('name'),wids.k[i]))
	merge_fonts(deck,dget(v,lms('f')))
	merge_prototypes(deck,defs?ld(defs):lmd(),wids?ll(wids):[]);const r=card_read(payload,deck);dset(deck.cards,name||ifield(r,'name'),r);return r
}
export const widget_purge=x=>{
	if(!x.volatile)return
	if(button_is(x))iwrite(x,lms('value'),NONE)
	if(slider_is(x))iwrite(x,lms('value'),NONE)
	if(field_is (x))iwrite(x,lms('value'),lms('')),iwrite(x,lms('scroll'),NONE)
	if(grid_is  (x))iwrite(x,lms('value'),lmt()  ),iwrite(x,lms('scroll'),NONE)
	if(canvas_is(x)){const t=frame;canvas_pick(x),draw_rect(frame.clip,0);frame=t}
	if(contraption_is(x))x.widgets.v.map(w=>widget_purge(w))
}
export const deck_purge=x=>{x.cards.v.map(c=>c.widgets.v.map(w=>widget_purge(w)))}
export const deck_read=x=>{
	const deck={},scripts=new Map(),cards={},modules={},defs={}, fonts=lmd(),sounds=lmd(); let i=0,m=0,md=0,lc=0
	Object.keys(FONTS).map(k=>dset(fonts,lms(k),font_read(FONTS[k])))
	const match=k=>x.startsWith(k,i)?(i+=k.length,1):0
	const end=_=>i>=x.length||x.startsWith('<\/script>',i)
	const str=e=>{let r='';while(!end()&&!match(e))r+=match('{l}')?'{': match('{r}')?'}': match('{c}')?':': match('{s}')?'/': x[i++];return clchars(r)}
	const last=dict=>{const k=Object.keys(dict);return dict[k[k.length-1]]||lmd()}
	match('<body><script language="decker">');while(!end()){
		if(x[i]=='\n')i++
		else if(x[i]=='#')while(!end()&&x[i]!='\n')i++
		else if(match('{deck}\n'   ))m=1
		else if(match('{fonts}\n'  ))m=2
		else if(match('{sounds}\n' ))m=3
		else if(match('{widgets}\n'))m=4
		else if(match('{card:')){const k=str('}');cards['~'+k]=lmd(['name','widgets'].map(lms),[lms(k),lml([])]),m=5,lc=0}
		else if(match('{script:')){const k=str('}\n');scripts.set(k,str('\n{end}'))}
		else if(match('{module:')){const k=str('}');modules['~'+k]=lmd(['name','script','data'].map(lms),[lms(k),lms(''),lmd()]),m=6,md=0}
		else if(match('{contraption:')){const k=str('}');defs['~'+k]=lmd(['name','widgets'].map(lms),[lms(k),lml([])]),m=7,lc=1}
		else if(m==6&&match('{data}\n')){md=1}
		else if(m==6&&match('{script}\n')){dset(last(modules),lms('script'),lms(str('\n{end}'))),m=1}
		else{
			const k=str(':'),j=pjson(x,i,x.length-i),v=j.value;i=j.index
			if(m==1)deck[k]=v
			if(m==2)dset(fonts,lms(k),font_read(ls(v)))
			if(m==3)dset(sounds,lms(k),sound_read(ls(v)))
			if(m==4&&!lc){if(Object.keys(cards).length)dget(last(cards),lms('widgets')).v.push(dset(ld(v),lms('name'),lms(k)))}
			if(m==4&& lc){if(Object.keys(defs ).length)dget(last(defs ),lms('widgets')).v.push(dset(ld(v),lms('name'),lms(k)))}
			if(m==5)dset(last(cards),lms(k),v)
			if(m==6)dset(md?dget(last(modules),lms('data')):last(modules),lms(k),v)
			if(m==7)dset(last(defs),lms(k),v)
		}
	}
	const dscript=x=>{const k=lms('script'),s=dget(x,k);if(s)dset(x,k,lms(scripts.get(ls(s))))}
	Object.values(cards).map(c=>{dscript(c),dget(c,lms('widgets')).v.map(dscript)})
	Object.values(defs ).map(c=>{dscript(c),dget(c,lms('widgets')).v.map(dscript)})
	const ri=lmi((self,i,x)=>{
		if(x){
			if(ikey(i,'locked'))return self.locked=lb(x),x
			if(ikey(i,'name'  ))return self.name=ls(x),x
			if(ikey(i,'author'))return self.author=ls(x),x
			if(ikey(i,'script'))return self.script=ls(x),x
			if(ikey(i,'card'  ))return n_go([x],self),x
		}else{
			if(ikey(i,'version' ))return lmn(self.version)
			if(ikey(i,'locked'  ))return lmn(self.locked)
			if(ikey(i,'name'    ))return lms(self.name)
			if(ikey(i,'author'  ))return lms(self.author)
			if(ikey(i,'script'  ))return lms(self.script)
			if(ikey(i,'patterns'))return self.patterns
			if(ikey(i,'sounds'  ))return dyad.drop(NONE,self.sounds)
			if(ikey(i,'fonts'   ))return dyad.drop(NONE,self.fonts)
			if(ikey(i,'cards'   ))return self.cards
			if(ikey(i,'modules' ))return self.modules
			if(ikey(i,'contraptions'))return self.contraptions
			if(ikey(i,'card'    ))return self.cards.v[min(count(self.cards)-1,self.card)]
			if(ikey(i,'add'     ))return lmnat(([x,y,z])=>deck_add(self,x,y,z))
			if(ikey(i,'remove'  ))return lmnat(([x])=>lmn(deck_remove(self,x)))
			if(ikey(i,'event'   ))return lmnat(args=>n_event(self,args))
			if(ikey(i,'copy'    ))return lmnat(([x])=>deck_copy(self,x))
			if(ikey(i,'paste'   ))return lmnat(([x])=>deck_paste(self,x))
			if(ikey(i,'purge'   ))return lmnat(()=>{deck_purge(self);return NONE})
		}return x?x:NONE
	},'deck')
	ri.fonts       =fonts
	ri.sounds      =sounds
	ri.contraptions=lmd()
	ri.cards       =lmd()
	ri.modules     =lmd()
	ri.transit     =lmd()
	ri.brushes     =lmd()
	ri.brusht      =lmd()
	ri.patterns    =patterns_read(deck)
	ri.version     =deck.hasOwnProperty('version')?ln(deck.version):1
	ri.locked      =deck.hasOwnProperty('locked' )?lb(deck.locked ):0
	ri.name        =deck.hasOwnProperty('name'   )?ls(deck.name   ):''
	ri.author      =deck.hasOwnProperty('author' )?ls(deck.author ):''
	ri.script      =deck.hasOwnProperty('script' )?scripts.get(ls(deck.script)):''
	ri.card        =deck.hasOwnProperty('card'   )?clamp(0,ln(deck.card),Object.keys(cards).length-1):0
	ri.size        =deck.hasOwnProperty('size'   )?rclamp(rect(8,8),getpair(deck.size),rect(4096,4096)):rect(512,342)
	if(Object.keys(cards).length==0)cards.home=lmd(['name'].map(lms),[lms('home')])
	const root=lmenv();constants(root),primitives(root,ri)
	pushstate(root),issue(root,parse(DEFAULT_TRANSITIONS));while(running())runop();popstate()
	Object.values(defs   ).map(x=>{const v=prototype_read(x,ri)      ;dset(ri.contraptions,ifield(v,'name'),v)})
	Object.values(cards  ).map(x=>{const v=card_read     (x,ri,cards);dset(ri.cards       ,ifield(v,'name'),v)})
	Object.values(modules).map(x=>{const v=module_read   (x,ri)      ;dset(ri.modules     ,ifield(v,'name'),v)})
	ri.history=[ln(ifield(ifield(ri,'card'),'index'))]
	return ri
}
export const deck_write=(x,html)=>{
	if(!deck_is(x))return '';let deck=x,scripts=lmd(),si=0,sci=0,r=(html?'<body><script language=\"decker\">\n':'')+'{deck}\nversion:1\n'
	const esc_write=(id,x)=>{
		let c='\0',lc=c,r='';for(let z=0;z<x.length;z++){
			lc=c,c=x[z],r+=c=='{'?'{l}': c=='}'?'{r}': c==':'&&id?'{c}': c=='/'&&lc=='<'?'{s}': c
		}return r
	}
	const script_ref=(base,x,suff)=>{
		if(ls(x)=='undefined')throw new Error('welp')
		for(let z=0;z<scripts.v.length;z++)if(match(scripts.v[z],x))return scripts.k[z]
		const k=lms(base?`${base}.${sci}${suff||''}`:`${sci}${suff||''}`);sci++;dset(scripts,k,x);return k
	}
	const write_scripts=_=>{while(si<scripts.v.length)r+=`\n{script:${esc_write(1,ls(scripts.k[si]))}}\n${esc_write(0,ls(scripts.v[si++]))}\n{end}\n`}
	const write_line=(s,k,p,f)=>{const v=s[k];if(p(v))r+=`${k}:${fjson(f(v))}\n`}
	const write_key =(s,k,p,f)=>{const v=dget(s,lms(k));if(p(v))r+=`${k}:${fjson(f(v))}\n`}
	const write_dict=(k,x,f)=>r+=`${count(x)?k:''}${x.k.map((k,i)=>`${esc_write(1,ls(k))}:${fjson(f(x.v[i]))}\n`).join('')}`
	const pp=patterns_write(x.patterns),pa=anims_write(x.patterns),da=dyad.parse(lms('%j'),lms(DEFAULT_ANIMS))
	write_line(x,'card'      ,x=>1                                  ,lmn                       )
	write_line(x,'size'      ,x=>1                                  ,lmpair                    )
	write_line(x,'locked'    ,x=>x                                  ,lmn                       )
	write_line(x,'script'    ,x=>x.length                           ,x=>script_ref(null,lms(x)))
	write_line(x,'name'      ,x=>x.length                           ,lms                       )
	write_line(x,'author'    ,x=>x.length                           ,lms                       )
	write_line(x,'patterns'  ,x=>pp!=DEFAULT_PATTERNS               ,x=>lms(pp)                )
	write_line(x,'animations',x=>!match(pa,da)                      ,x=>pa                     )
	write_scripts()
	write_dict('\n{fonts}\n',dyad.drop(lml(['body','menu','mono'].map(lms)),deck.fonts),x=>lms(font_write(x)))
	write_dict('\n{sounds}\n',deck.sounds,x=>lms(sound_write(x)))
	deck.cards.v.map(c=>{
		const data=card_write(c),wids=dget(data,lms('widgets')),base=ls(dget(data,lms('name')));sci=0
		r+=`\n{card:${esc_write(1,base)}}\n`
		write_key(data,'image' ,x=>x ,x=>x                 )
		write_key(data,'script',count,x=>script_ref(base,x))
		wids.v.map(wid=>{const k=lms('script'),v=dget(wid,k);if(v)dset(wid,k,script_ref(base,v))})
		write_dict('{widgets}\n',wids,x=>x)
		write_scripts()
	})
	deck.modules.v.map(m=>{
		const data=module_write(m)
		r+=`\n{module:${esc_write(1,ls(dget(data,lms('name'))))}}\n`
		write_key(data,'description',x=>x,x=>x)
		write_key(data,'version'    ,x=>x,x=>x)
		write_dict('{data}\n',dget(data,lms('data')),x=>x)
		r+=`{script}\n${esc_write(0,ls(ifield(m,'script')))}\n{end}\n`
	})
	deck.contraptions.v.map(def=>{
		const data=prototype_write(def),wids=dget(data,lms('widgets')),base=ls(dget(data,lms('name')));sci=0
		r+=`\n{contraption:${esc_write(1,base)}}\n`
		write_key(data,'size'       ,x=>1       ,x=>x)
		write_key(data,'resizable'  ,x=>x&&lb(x),x=>x)
		write_key(data,'margin'     ,x=>1       ,x=>x)
		write_key(data,'description',x=>x       ,x=>x)
		write_key(data,'version'    ,x=>x       ,x=>x)
		write_key(data,'image'      ,x=>x       ,x=>x)
		write_key(data,'script'     ,x=>count(x),x=>script_ref(base,x,'p'))
		write_key(data,'template'   ,x=>count(x),x=>x)
		write_key(data,'attributes' ,x=>count(x),x=>x)
		wids.v.map(wid=>{const k=lms('script'),v=dget(wid,k);if(v)dset(wid,k,script_ref(base,v,'p'))})
		write_dict('{widgets}\n',wids,x=>x)
		write_scripts()
	})
	return r+'\n'+(html?'<\/script>\nRuntime stub is NYI.':'')
}

export const n_go=([x,t,delay],deck)=>{
	let r=null, i=deck.card
	if(lin(x))r=clamp(0,ln(x),count(deck.cards)-1)
	else if(card_is(x)){const i=dvix(deck.cards,x);if(i>=0)r=i}
	else{
		x=ls(x);if(deck.history.length>1&&x=='Back'){
			deck.history.pop();const ix=last(deck.history);
			if(ix>=0&&ix<count(deck.cards)){go_notify(deck,ix,t,x,delay),deck.card=ix;return lmn(deck.card)}
		}
		else if(x=='First')r=0
		else if(x=='Last' )r=count(deck.cards)-1
		else if(x=='Prev' )r=mod(i-1,count(deck.cards))
		else if(x=='Next' )r=mod(i+1,count(deck.cards))
		else{const ix=dkix(deck.cards,lms(x));if(ix>=0)r=ix}
	}if(r!=null){go_notify(deck,r,t,x,delay),deck.card=r;if(i!=r)deck.history.push(r)}else{go_notify(deck,-1,t,x,delay)}return lmn(deck.card)
}
export const n_sleep=([z])=>{if(lis(z)&&ls(z)=='play'){sleep_play=1}else{sleep_frames=max(1,ln(z))};return z}
export const n_transition=(f,deck)=>{const t=deck.transit;if(lion(f))dset(t,lms(f.n),f);return t}

const ext={}
const ext_constants={}
export const constants=env=>{
	env.local('sys'    ,interface_system)
	env.local('app'    ,interface_app)
	env.local('bits'   ,interface_bits)
	env.local('rtext'  ,interface_rtext)
	env.local('pointer',pointer)
	env.local('pi'   ,lmn(3.141592653589793))
	env.local('e'    ,lmn(2.718281828459045))
	env.local('colors',lmd(
		'white|yellow|orange|red|magenta|purple|blue|cyan|green|darkgreen|brown|tan|lightgray|mediumgray|darkgray|black'.split('|').map(lms),
		range(16).map(x=>lmn(x+32))
	))
	Object.keys(ext_constants).map(key=>env.local(key,ext_constants[key]))
}
export const primitives=(env,deck)=>{
	env.local('show'      ,lmnat(n_show    ))
	env.local('print'     ,lmnat(n_print   ))
	env.local('panic'     ,lmnat(n_panic   ))
	env.local('play'      ,lmnat(n_play    ))
	env.local('go'        ,lmnat(([x,t,d])=>n_go([x,t,d],deck)))
	env.local('transition',lmnat(([f])=>n_transition(f,deck)))
	env.local('brush'     ,lmnat(x=>n_brush(x,deck)))
	env.local('sleep'     ,lmnat(n_sleep   ))
	env.local('eval'      ,lmnat(n_eval    ))
	env.local('random'    ,lmnat(n_random  ))
	env.local('array'     ,lmnat(n_array   ))
	env.local('image'     ,lmnat(n_image   ))
	env.local('sound'     ,lmnat(n_sound   ))
	env.local('readcsv'   ,lmnat(n_readcsv ))
	env.local('writecsv'  ,lmnat(n_writecsv))
	env.local('readxml'   ,lmnat(n_readxml ))
	env.local('writexml'  ,lmnat(n_writexml))
	env.local('alert'     ,lmnat(n_alert   ))
	env.local('read'      ,lmnat(n_open    ))
	env.local('write'     ,lmnat(n_save    ))
}
let in_attr=0
export const fire_attr_sync=(target,name,a)=>{
	if(in_attr>=2)return NONE;in_attr++;const bf=frame;
	const root=lmenv();primitives(root,target.deck),constants(root)
	root.local('me',target),root.local('card',target),root.local('deck',target.deck),root.local('patterns',target.deck.patterns)
	const b=lmblk();target.widgets.v.map((v,i)=>{blk_lit(b,v),blk_loc(b,target.widgets.k[i]),blk_op(b,op.DROP)})
	try{blk_cat(b,parse(target.def.script)),blk_op(b,op.DROP)}catch(e){}
	blk_get(b,lms(name)),blk_lit(b,lml(a?[a]:[])),blk_op(b,op.CALL)
	pushstate(root),issue(root,b);let q=ATTR_QUOTA;while(running()&&q>0)runop(),q--;const r=running()?NONE:arg();popstate();frame=bf;return in_attr--,r
}
export const parent_deck=x=>deck_is(x)?x: card_is(x)||prototype_is(x)?x.deck: parent_deck(x.card)
export const event_invoke=(target,name,arg,hunk,nodiscard)=>{
	const scopes=lmd([NONE],[parse(DEFAULT_HANDLERS)]); let deck=null
	const ancestors_record=(target,src)=>{try{dset(scopes,target,parse(ls(ifield(src,'script'))))}catch(e){dset(scopes,target,lmblk())}}
	const ancestors_inner=target=>{
		if(deck_is(target)){deck=target;return}
		if(contraption_is(target)){deck=target.card.deck}
		else if(card_is(target)||prototype_is(target)){deck=target.deck}
		else{ancestors_inner(target.card)}
		ancestors_record(target,contraption_is(target)?ifield(target,'def'):target)
	}
	const ancestors_outer=target=>{
		if(deck_is(target)){deck=target}
		else if(widget_is(target)){ancestors_outer(target.card)}
		else{ancestors_outer(target.deck)}
		ancestors_record(target,target)
	}
	(prototype_is(target)||prototype_is(target.card)||contraption_is(target.card))?ancestors_inner(target):ancestors_outer(target)
	const bind=(b,n,v)=>{blk_lit(b,v),blk_loc(b,n),blk_op(b,op.DROP)}
	const func=(b,n,v)=>{blk_lit(b,lmon(n,[],blk_end(v))),blk_op(b,op.BIND),blk_op(b,op.DROP),name=n,arg=lml([])}
	let core=null
	for(let z=scopes.v.length-1;z>=0;z--){
		let t=scopes.k[z], b=lmblk(), sname='!widget_scope'
		if(lin(t))sname='!default_handlers'
		if(deck_is(t)){
			t.modules.v.map((v,i)=>bind(b,t.modules.k[i],ifield(v,'value')))
			t.cards  .v.map((v,i)=>bind(b,t.cards  .k[i],v                ))
			sname='!deck_scope'
		}
		if(card_is(t)||prototype_is(t)||(contraption_is(t)&&target!=t)){
			bind(b,lms('card'),t)
			t.widgets.v.map((v,i)=>bind(b,t.widgets.k[i],v))
			sname='!card_scope'
		}
		blk_cat(b,scopes.v[z]),blk_op(b,op.DROP)
		if(!core&&hunk){func(b,'!hunk',hunk)}
		else if(core){func(b,sname,core)}
		blk_get(b,lms(name)),blk_lit(b,arg),blk_op(b,op.CALL);if(!hunk&&!nodiscard)blk_op(b,op.DROP);core=b
	}
	const r=lmblk();bind(r,lms('me'),proxy_is(target)?ivalue(target,'card'):target)
	bind(r,lms('deck'),deck),bind(r,lms('patterns'),deck.patterns)
	return blk_cat(r,core),r
}
export const fire_async=(target,name,arg,hunk,nest)=>{
	const root=lmenv();primitives(root,parent_deck(target)),constants(root)
	if(nest)pushstate(root),pending_popstate=1;issue(root,event_invoke(target,name,arg,hunk,0))
}
export const fire_event_async=(target,name,x)=>fire_async(target,name,lml([x]),null,1)
export const fire_hunk_async=(target,hunk)=>fire_async(target,null,lml([]),hunk,1)
export const n_event=(self,args)=>{
	const root=lmenv();primitives(root,parent_deck(self)),constants(root)
	const b=lmblk();blk_op(b,op.DROP),blk_cat(b,event_invoke(self,ls(args[0]),lml(args.slice(1)),null,1))
	return issue(root,b),NONE
}
export const readgif=(data,hint)=>{
	const gray=hint=='gray'||hint=='gray_frames', frames=hint=='frames'||hint=='gray_frames'
	let i=0;const ub=_=>data[i++]||0, s=_=>ub()|(ub()<<8), struct=(f,d)=>lmd(['frames','delays'].map(lms),[lml(f),lml(d)])
	function readcolors(r,packed){const c=1<<((packed&0x07)+1);for(let z=0;z<c;z++)r[z]=readcolor(ub(),ub(),ub(),gray);return r}
	if(ub()!=71||ub()!=73||ub()!=70)return frames?struct([],[]):image_make(rect());i+=3;const r_frames=[],r_delays=[],r_disposal=[],r_dict=lmd()
	const w=s(),h=s(),gpal=new Uint8Array(256),packed=ub(),back=ub();ub()
	let hastrans=0,trans=255,delay=0,dispose=0,r=image_make(rect(w,h));if(packed&0x80)readcolors(gpal,packed)
	while(i<data.length){
		const type=ub()
		if(type==0x3B)break // end
		if(type==0x21){ // text, gce, comment, app...?
			if((0xFF&ub())==0xF9){
				ub();const packed=ub();delay=s()
				const tindex=ub();ub();dispose=(packed>>2)&7
				if(packed&1){hastrans=1,trans=tindex}else{hastrans=0}
			}else{while(1){const s=ub();if(!s)break;i+=s}}
		}
		if(type==0x2C){ // image descriptor
			const xo=s(),yo=s(),iw=s(),ih=s(),packed=ub(),local=packed&0x80
			const lpal=new Uint8Array(gpal);if(local)readcolors(lpal,packed);if(hastrans)lpal[trans]=gray?255:0
			const min_code=ub(),src=new Uint8Array(iw*ih*2),dst=new Uint8Array(iw*ih);let si=0, di=0
			while(1){const s=ub();if(!s)break;for(let z=0;z<s;z++)src[si++]=ub()}
			const prefix=new Int32Array(4096),suffix=new Int32Array(4096),code=new Int32Array(4096)
			const clear=1<<min_code; let size=min_code+1, mask=(1<<size)-1, next=clear+2, old=-1, first=0, i=0,b=0,d=0
			for(let z=0;z<clear;z++)suffix[z]=z
			while(i<si){
				while(b<size)d+=(0xFF&src[i++])<<b, b+=8
				let t=d&mask; d>>=size, b-=size
				if(t>next||t==clear+1)break
				if(t==clear){size=min_code+1, mask=(1<<size)-1, next=clear+2, old=-1}
				else if (old==-1) dst[di++]=suffix[old=first=t]
				else{
					let ci=0,tt=t
					if   (t==next)code[ci++]=first,    t=old
					while(t>clear)code[ci++]=suffix[t],t=prefix[t]
					dst[di++]=first=suffix[t]
					while(ci>0)dst[di++]=code[--ci]
					if(next<4096){prefix[next]=old, suffix[next++]=first;if((next&mask)==0&&next<4096)size++, mask+=next}
					old=tt
				}
			}
			for(let y=0;y<ih;y++)for(let x=0;x<iw;x++)if(xo+x>=0&&yo+y>=0&&xo+x<w&&yo+y<h&&(!hastrans||dst[x+y*iw]!=trans))r.pix[(xo+x)+(yo+y)*w]=lpal[dst[x+y*iw]]
			r_frames.push(image_copy(r)),r_delays.push(lmn(delay)),r_disposal.push(dispose);if(!frames)break
			if(dispose==2){r.pix.fill(hastrans?0:lpal[back])} // dispose to background
			if(dispose==3){let i=r_frames.length-2;while(i&&r_disposal[i]>=2)i--;for(let z=0;z<r.pix.length;z++)r.pix[z]=r_frames[i].pix[z];}// dispose to previous
		}
	}return frames?struct(r_frames,r_delays): r_frames.length?r_frames[0]: image_make(rect())
}
// Decker

let zoom=1, deck=null, fb=null, context=null, dirty=0
let FONT_BODY=null,FONT_MENU=null,FONT_MONO=null

const ELLIPSIS=String.fromCharCode(95+32)
const DOUBLE_CLICK_DELAY=20
const FIELD_CURSOR_DUTY =20
const FIELD_CHANGE_DELAY=15
const LISTEN_LINES      =30
const LISTEN_SIZE       =_=>rect(context.size.x-22,100)
const MASTER_VOLUME     =0.3
const BG_MASK           =100

export const q=x=>document.querySelector(x)
export const gcd=(x,y)=>{while(x!=y){if(x>y){x-=y}else{y-=x}}return x}
export const lcm=(x,y)=>{const r=gcd(x,y);return 0|((x*y)/(r?r:1))}
export const copy_object=x=>Object.keys(x).reduce((r,k)=>((r[k]=x[k]),r),{})
export const plain_or_rich=x=>lit(x)?rtext_cast(x):lms(x?ls(x):'')
export const fieldstr=x=>({table:rtext_cast(x),scroll:0})
export const gridtab=(x,r)=>({table:x,scroll:0,row:r==undefined?-1:r,col:-1})
export const open_url=x=>{window.open(x,'_blank')}
export const open_file=(filter,f)=>{const s=q('#source');s.value='',s.accept=filter,s.onchange=_=>{if(s.files.length)f(s.files[0])},s.click()}
export const open_text=(filter,f)=>open_file(filter,file=>{const r=new FileReader();r.onload=_=>{f(clchars(r.result))},r.readAsText(file)})
export const load_array=(file,after)=>{const r=new FileReader();r.onload=_=>{const b=new Uint8Array(r.result);after(array_make(b.length,'u8',0,b))},r.readAsArrayBuffer(file)}
export const load_image=(file,hint,after)=>{
	const read_image=grayscale=>{
		const i=q('#loader'),w=i.width,h=i.height,r=image_make(rect(w,h)); if(w==0||h==0)return r
		const t=document.createElement('canvas');t.width=w,t.height=h
		const tg=t.getContext('2d');tg.drawImage(i,0,0)
		const d=tg.getImageData(0,0,w,h).data
		let src=0,dst=0;while(dst<r.pix.length){
			const cr=d[src++],cg=d[src++],cb=d[src++],ca=d[src++]
			r.pix[dst++]=(ca!=0xFF)?(grayscale?0xFF:0x00): readcolor(cr,cg,cb,grayscale)
		}return r
	}
	const import_image=_=>{
		if(after){after(read_image(hint=='gray'));return}
		let i=read_image(0),m=null; if(i.size.x==0||i.size.y==0)return
		let color=0,c=new Uint8Array(256);i.pix.forEach(p=>c[p]++)
		let tw=c[0],ow=c[32];c[32]=0,c[47]=0;for(let z=2;z<256;z++)if(c[z]){color=1;break}
		if(color&&tw)i.pix.forEach((p,z)=>i.pix[z]=p!=0),m=i
		if(color){i=read_image(!dr.color)}else if(ow&&!tw){i.pix.forEach((p,z)=>i.pix[z]=p!=32)}
		setmode('draw'),bg_paste(i,1);dr.limbo_dither=color&&!dr.color,dr.dither_threshold=0.5,dr.fatbits=0,dr.omask=m
	}
	if(file.type=='image/gif'&&after){const r=new FileReader();r.onload=_=>{after(readgif(new Uint8Array(r.result),hint))};r.readAsArrayBuffer(file)}
	else{const r=new FileReader();r.onload=_=>{q('#loader').src=r.result;setTimeout(import_image,100)};r.readAsDataURL(file)}
}
export const save_text=(n,x)=>{
	const u=URL.createObjectURL(new Blob([x])), t=q('#target')
	t.download=n,t.href=u,t.click(),setTimeout(_=>URL.revokeObjectURL(u),200)
}
export const save_bin=(n,x)=>{
	const u=URL.createObjectURL(new Blob([Uint8Array.from(x)])), t=q('#target')
	t.download=n,t.href=u,t.click(),setTimeout(_=>URL.revokeObjectURL(u),200)
}
export const makelzww=(lw,bw)=>{
	let w=1+lw,hi=(1<<lw)+1,ov=1<<(lw+1),sc=-1,b=0,nb=0,t={}
	wb=c=>{b|=c<<nb;nb+=w;while(nb>=8){bw(b&0xff),b>>=8,nb-=8}}
	ih=()=>{hi++;if(hi==ov){w++,ov<<=1}if(hi==0xfff){let c=1<<lw;wb(c),w=lw+1,hi=c+1,ov=c<<1,t={};return 1}}
	return {
		w(b) {
			let c=sc;if(c==-1){wb(1<<lw),sc=b;return} /* first write sends clear code */
			let k=(c<<8)|b;if(t[k]!==undefined){sc=t[k]}else{wb(c),sc=b;if(!ih())t[k]=hi}
		},
		f() {wb(sc),ih(),wb((1<<lw)+1),nb>0&&bw(b&0xff)}
	}
}
export const writegif=(frames,delays)=>{
	const size=frames.reduce((s,f)=>rmax(s,f.size),rect(1,1)), pal=deck.patterns.pal.pix; let frame_index=0, payload=[]
	const anim_ants       =(x,y)=>(0|((x+y+frame_index)/3))%2?15:0
	const draw_pattern    =(pix,x,y)=>pix<2?(pix?1:0): pix>31?(pix==32?0:1): pal_pat(pal,pix,x,y)&1
	const draw_color_trans=(pix,x,y)=>pix==ANTS?anim_ants(x,y): pix==0?16: pix>47?0: pix>31?pix-32: draw_pattern(pix,x,y)?15:0
	const b=x=>payload.push(x&0xFF), s=x=>{b(x);b(x>>8)}, t=x=>x.split('').forEach(x=>b(x.charCodeAt(0)))
	t('GIF89a'),s(size.x),s(size.y) // header, dimensions
	b(0xF4)                         // global colortable, 8-bits per channel, 32 colors
	b(0),b(0)                       // background color is 0, 1:1 pixel aspect ratio
	for(let z=0;z<16;z++)b(COLORS[z]>>16),b(COLORS[z]>>8),b(COLORS[z]) // global colortable
	for(let z=0;z<16;z++)b(0xFF         ),b(0xFF        ),b(0xFF     ) // padding entries
	s(0xFF21),b(11),t('NETSCAPE2.0'),b(3),b(1),s(0),b(0)               // NAB; loop gif forever
	for(let z=0;z<frames.length;z++){
		const frame=frames[z]
		s(0xF921),b(4)                            // graphic control extension
		b(9),s(delays[z]),b(16)                   // dispose to bg + has transparency, 100ths of a second delay, color 16 is transparent
		b(0)                                      // end GCE
		b(0x2C)                                   // image descriptor
		s(0),s(0),s(frame.size.x),s(frame.size.y) // dimensions
		b(0),b(5)                                 // no local colortable,  minimum LZW code size
		let bo=payload.length
		let lw=makelzww(5,b=>{if(bo==payload.length)payload.push(0);payload[bo]++;payload.push(b);if(payload[bo]==255)bo=payload.length});
		for(let y=0;y<frame.size.y;y++)for(let x=0;x<frame.size.x;x++)lw.w(draw_color_trans(frame.pix[y*frame.size.x+x],x,y))
		lw.f(),b(0),frame_index++ // end of frame
	};b(0x3B);return payload
}
export const writewav=sound=>{
	const payload=[], b=x=>payload.push(x&0xFF), s=x=>(b(x),b(x>>8))
	const d=x=>(b(x),b(x>>8),b(x>>16),b(x>>24)), t=x=>x.split('').forEach(x=>b(x.charCodeAt(0)))
	t('RIFF'),d(4+24+(8+sound.data.length)+(sound.data.length%2))
	t('WAVE'),t('fmt ')
	d(16)             // chunk size
	s(1),s(1),d(8000) // pcm, 1 channel, 8khz
	d(8000)           // 8000*(1 byte per sample)*(1 channel)
	s(1)              //      (1 byte per sample)*(1 channel)
	s(8)              // 8 bits per sample
	t('data'),d(sound.data.length)
	for(let z=0;z<sound.data.length;z++)b(128+sound.data[z])
	if(sound.data.length%2)b(0);return payload
}
export const writearray=array=>{
	const payload=[]
	for(let z=0;z<array.size;z++){const ix=array.base+z;payload.push(ix>=0&&ix<array.data.length?array.data[ix]:0)}
	return payload
}

export const keep_ratio=(r,s)=>{if(!ev.shift||s.x==0||s.y==0)return r;const scale=max(r.w/(s.x*1.0),r.h/(s.y*1.0));return rect(r.x,r.y,scale*s.x,scale*s.y)}
export const draw_frame=(image,clip)=>({brush:0,pattern:0,font:FONT_BODY,size:image.size,clip:clip||rect(0,0,image.size.x,image.size.y),image})
export const draw_pix=(x,y,pattern)=>{const h=rect(x,y);if(inclip(h))pix(h,pattern)}
export const draw_invert=(pal,r)=>{
	const draw_pattern=(pix,x,y)=>pix<2?(pix?1:0): pix>31?(pix==32?0:1): pal_pat(pal,pix,x,y)&1; r=rclip(r,frame.clip)
	for(let a=r.y;a<r.y+r.h;a++)for(let b=r.x;b<r.x+r.w;b++){const h=rect(b,a), p=draw_pattern(gpix(h),b,a);pix(h,p==0||p==32?1:32)}
}
export const draw_shadow=(r,fcol,bcol,solid)=>{
	if(solid)draw_rect(rclip(r,frame.clip),bcol);draw_box(r,0,fcol),draw_hline(r.x+3,r.x+r.w,r.y+r.h,fcol),draw_vline(r.x+r.w,r.y+2,r.y+r.h+1,fcol)
}
export const draw_boxr=(r,fcol,bcol,background)=>{
	r=rint(r)
	draw_hline(r.x+2,r.x+r.w-2,r.y,fcol),draw_hline(r.x+2,r.x+r.w-2,r.y+r.h-1,fcol),draw_vline(r.x,r.y+2,r.y+r.h-2,fcol),draw_vline(r.x+r.w-1,r.y+2,r.y+r.h-2,fcol)
	draw_pix(r.x+1,r.y+1,fcol),draw_pix(r.x+r.w-2,r.y+1,fcol),draw_pix(r.x+1,r.y+r.h-2,fcol),draw_pix(r.x+r.w-2,r.y+r.h-2,fcol)
	if(background)draw_hline(r.x+2,r.x+r.w-2,r.y+1,bcol),draw_hline(r.x+2,r.x+r.w-2,r.y+r.h-2,bcol),draw_rect(rect(r.x+1,r.y+2,r.w-2,r.h-4),bcol)
}
export const draw_boxinv=(pal,r)=>{
	draw_invert(pal,rect(r.x,r.y,1,r.h))    ,draw_invert(pal,rect(r.x+r.w-1,r.y,1,r.h))
	draw_invert(pal,rect(r.x+1,r.y,r.w-2,1)),draw_invert(pal,rect(r.x+1,r.y+r.h-1,r.w-2,1))
}
export const draw_modalbox=s=>{
	const menu=16, r=rcenter(rect(0,menu,frame.size.x,frame.size.y-menu),s), o=inset(r,-5)
	draw_rect(inset(o,-5),32),draw_box(inset(o,-5),0,1),draw_box(inset(o,-2),0,1),draw_box(inset(o,-1),0,1);return r
}
export const draw_modal_rtext=extra=>{
	const size=rect(200,100)
	const l=lit(ms.message)?layout_richtext(deck,ms.message,FONT_BODY,ALIGN.center,size.x):layout_plaintext(ls(ms.message),FONT_BODY,ALIGN.center,size)
	const b=draw_modalbox(radd(l.size,extra)), tbox=rect(b.x,b.y,b.w,l.size.y)
	if(lit(ms.message)){draw_text_rich(tbox,l,1,1)}else{draw_text_wrap(tbox,l,1)}
	return b
}
export const draw_text_outlined=(pos,text,f)=>{
	([[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]).map(([x,y])=>draw_text(rect(pos.x+x,pos.y+y),text,f,32))
	draw_text(pos,text,f,1)
}
export const draw_textr=(r,text,font,pattern)=>{
	const size=font_textsize(font,text)
	if(size.x<r.w){draw_text(rect(r.x+r.w-size.x,r.y+ceil((r.h-size.y)/2),size.x,r.h),text,font,pattern)}else{draw_text_fit(r,text,font,pattern)}
}
export const draw_textc=(r,text,font,pattern)=>{
	const size=font_textsize(font,text)
	if(pattern==-1){draw_text_outlined(rcenter(r,size),text,font)}
	else if(size.x<r.w){draw_text(rcenter(r,size),text,font,pattern)}else{draw_text_fit(r,text,font,pattern)}
}
export const draw_text_fit=(r,text,font,pattern)=>{
	const glyphs=[], glyph_push=(pos,c)=>glyphs.push({pos,c})
	let x=0,y=0,fh=font_h(font),ew=font_gw(font,ELLIPSIS)
	for(let z=0;z<text.length&&(y+fh)<=r.h;z++){
		const c=text[z]
		if(c=='\n'){x=0,y+=fh}
		else if(x+font_gw(font,c)>=(r.w-ew)){glyph_push(rect(x,y),ELLIPSIS);while(z<text.length&&text[z]!='\n')z++;x=0;if(z<text.length){y+=fh}else{z--}}
		else{glyph_push(rect(x,y),c),x+=font_gw(font,c)+font_sw(font)}
	}
	let yo=ceil((r.h-(y+fh))/2.0);glyphs.map(g=>{g.pos.x+=r.x,g.pos.y+=yo+r.y,draw_char(g.pos,font,g.c,pattern)})
}
export const draw_scaled=(r,image,opaque)=>{
	if(r.w==0||r.h==0)return;const s=image.size
	if(r.w==s.x&&r.h==s.y){image_paste(r,frame.clip,image,frame.image,opaque);return}
	image_paste_scaled(r,frame.clip,image,frame.image,opaque)
}
export const draw_invert_scaled=(pal,r,image)=>{
	if(r.w==0||r.h==0)return;const s=image.size, fb=frame.image.pix, fs=frame.image.size.x, sc=lerp_scale(r,s)
	const draw_pattern=(pix,x,y)=>pix<2?(pix?1:0): pix>31?(pix==32?0:1): pal[(x%8)+(8*(y%8))+(8*8*pix)]&1
	const gpix=p=>fb[p.x+p.y*fs], pix=(p,v)=>fb[p.x+p.y*fs]=v
	for(let a=0;a<r.h;a++)for(let b=0;b<r.w;b++){
		const sx=0|(b/sc.x), sy=0|(a/sc.y), dx=r.x+b, dy=r.y+a, v=image.pix[sx+sy*s.x]
		const c=draw_pattern(v,dx,dy), h=rect(dx,dy)
		if(inclip(h))pix(h,c^draw_pattern(gpix(h),dx,dy))
	}
}
export const draw_fat=(r,image,pal,frame_count,mask,scale,offset)=>{
	const anim=deck.patterns.anim
	const anim_pattern=(pix,x,y)=>pix<28||pix>31?pix: anim[pix-28][(0|(frame_count/4))%max(1,anim[pix-28].length)]
	const draw_pattern=(pix,x,y)=>pix<2?(pix?1:0): pix>31?(pix==32?0:1): pal[(x%8)+(8*(y%8))+(8*8*pix)]&1
	const s=image.size;for(let y=0;y<ceil(r.h/scale);y++)for(let x=0;x<ceil(r.w/scale);x++){
		if(offset.x+x>=s.x||offset.y+y>=s.y||offset.x+x<0||offset.y+y<0)continue
		const v=image.pix[(offset.x+x)+(offset.y+y)*s.x];if(v==mask)continue
		const c=anim_pattern(v,offset.x+x,offset.y+y),p=draw_pattern(c,offset.x+x,offset.y+y)
		draw_rect(radd(rect(x*scale,y*scale,scale,scale),rect(r.x,r.y)),c>=32?c: c==0?0: p?1:32)
	}
}
export const draw_fat_scaled=(r,image,opaque,pal,frame_count,scale,offset)=>{
	const anim=deck.patterns.anim
	const anim_pattern=(pix,x,y)=>pix<28||pix>31?pix: anim[pix-28][(0|(frame_count/4))%max(1,anim[pix-28].length)]
	const draw_pattern=(pix,x,y)=>pix<2?(pix?1:0): pix>31?(pix==32?0:1): pal[(x%8)+(8*(y%8))+(8*8*pix)]&1
	if(r.w==0||r.h==0)return;const s=image.size, sc=lerp_scale(r,s)
	for(let a=0;a<r.h;a++)for(let b=0;b<r.w;b++){
		const sx=0|(b/sc.x), sy=0|(a/sc.y), dx=r.x+b, dy=r.y+a, v=image.pix[sx+sy*s.x]
		const c=anim_pattern(v,dx,dy),p=draw_pattern(c,dx,dy)
		if(opaque||v!=0)draw_rect(radd(rect(dx*scale,dy*scale,scale,scale),offset),c>=32?c: p?1:0)
	}
}
export const draw_dithered=(r,image,opaque,mask,threshold)=>{
	if(r.w==0||r.h==0)return;const s=image.size, stride=2*r.w, m=[0,1,r.w-2,r.w-1,r.w,stride-1], dither_err=new Float32Array(stride)
	for(let ei=0,a=0;a<r.h;a++)for(let b=0;b<r.w;b++){
		const sx=0|(((b*1.0)/r.w)*s.x), sy=0|(((a*1.0)/r.h)*s.y), src=0xFF&image.pix[sx+sy*s.x], ms=mask?mask.pix[sx+sy*s.x]:1
		const p=(src/256.0)+dither_err[ei], col=p>threshold?1:0, err=(p-col)/8.0
		dither_err[ei]=0, ei=(ei+1)%stride; for(let z=0;z<6;z++)dither_err[(ei+m[z])%stride]+=err
		const c=!col;if(ms&&(opaque||c!=0)){const h=rect(r.x+b,r.y+a);if(inclip(h))pix(h,c)}
	}
}
export const draw_widget=w=>{
	if(canvas_is(w))return container_image(w,1)
	const im=ms.in_modal,it=ms.type;ms.in_modal=1,ms.type='about'
	const rsize=getpair(ifield(w,'size')),r=image_make(rsize),t=frame,te=copy_object(ev);frame=draw_frame(r),ev=event_state(),menus_clear() // !!!
	if     (button_is     (w)){const p=unpack_button(w);p.size.x=0,p.size.y=0;widget_button(w,p,lb(ifield(w,'value')))}
	else if(slider_is     (w)){const p=unpack_slider(w);p.size.x=0,p.size.y=0;widget_slider(w,p)}
	else if(grid_is       (w)){const p=unpack_grid  (w);p.size.x=0,p.size.y=0;widget_grid  (w,p,unpack_grid_value(w))}
	else if(field_is      (w)){const p=unpack_field (w);p.size.x=0,p.size.y=0;widget_field (w,p,unpack_field_value(w))}
	else if(contraption_is(w)){const o=w.pos;w.pos=rect(0,0);widget_contraption(w);w.pos=o}
	return ev=te,frame=t,ms.in_modal=im,ms.type=it,r
}
export const draw_con=(card,active)=>{
	const im=ms.in_modal,it=ms.type;ms.in_modal=active;if(active){ms.type='about',menus_clear()}
	const rsize=getpair(ifield(card,'size')),r=image_make(rsize),t=frame,te=copy_object(ev);frame=draw_frame(r),ev=event_state()
	const back=ifield(card,'image'), bsize=back.size, wids=card.widgets
	if(bsize.x!=0&&bsize.y!=0)image_paste(rpair(rect(),bsize),frame.clip,back,frame.image,1)
	if(uimode!='draw'||dr.show_widgets)wids.v.map(w=>{
		if(button_is     (w))widget_button(w,unpack_button(w),lb(ifield(w,'value')))
		if(slider_is     (w))widget_slider(w,unpack_slider(w))
		if(canvas_is     (w))widget_canvas(w,unpack_canvas(w),container_image(w,0))
		if(grid_is       (w))widget_grid  (w,unpack_grid  (w),unpack_grid_value(w))
		if(field_is      (w))widget_field (w,unpack_field (w),unpack_field_value(w))
		if(contraption_is(w))widget_contraption(w)
	});return ev=te,frame=t,ms.in_modal=im,ms.type=it,r
}
export const draw_thumbnail=(card,r)=>{
	const back=ifield(card,'image');r=inset(r,1),draw_rect(r,0);if(back.size.x>0||back.size.y>0)draw_scaled(r,back,1)
	const wids=ifield(card,'widgets'),s=getpair(ifield(card,'size')), xr=r.w*(1.0/s.x), yr=r.h*(1.0/s.y)
	wids.v.map(wid=>{const w=unpack_widget(wid);draw_box(rclip(rect(r.x+w.size.x*xr,r.y+w.size.y*yr,w.size.w*xr,w.size.h*yr),r),0,w.show=='invert'?0:1)})
}
export const draw_lil=(size,align,bare,x)=>{
	const GAP=50, w=size.x-GAP; let xo=align==ALIGN.right?GAP: align==ALIGN.left?0: 0|(GAP/2)
	const r=image_make(size), t=frame; frame=draw_frame(r)
	if(lit(x)){
		const tk=tab_cols(x), tc=tk.length, tr=tab_rowcount(x)
		const hh=tc?3+font_h(FONT_BODY):3, ch=font_h(FONT_MONO), fh=font_h(FONT_BODY), rows=0|min((size.y-(hh+fh))/ch,tr)
		const f=dyad.take(NONE,x), cw=range(256).map(x=>0)
		for(let c=0;c<tc&&c<256;c++){
			const dr=rows<tr?rows-1:rows;cw[c]=0;for(let r=0;r<dr;r++){
				const s=show(tab_cell(x,tk[c],r));tab_get(f,tk[c]).push(lms(s))
				cw[c]=max(cw[c],font_textsize(FONT_MONO,s).x+10)
			}if(rows<tr)tab_get(f,tk[c]).push(lms(' \x7f'))
			cw[c]=min(100,max(cw[c],font_textsize(FONT_BODY,tk[c]).x+10))
		}
		let cols=0,tw=0,ve=0;for(let c=0;c<tc&&c<256;c++){if(tw+cw[c]>=w){ve=1;break};cols++;if(c+1<=tc&&c+1<=256)tw+=cw[c]}
		xo=align==ALIGN.right?size.x-tw: align==ALIGN.left?0: 0|((size.x-tw)/2)
		let cx=xo;for(let c=0;c<cols;c++){
			if(c)draw_vline(cx,0,hh+ch*rows+(rows==0),1);draw_text_fit(rect(cx+2,0,cw[c]-4,hh),tk[c],FONT_BODY,1)
			for(let r=0;r<rows;r++)draw_text_fit(rect(cx+2,hh+ch*r,cw[c]-4,ch),ls(tab_cell(f,tk[c],r)),FONT_MONO,1)
			if(c+1<=cols)cx+=cw[c]
		}draw_hline(xo,cx,hh-1,1);const bh=hh+ch*rows+1+(rows==0);if(cx==xo)cx+=min(25,w)
		const desc=`(${tc} column${tc==1?'':'s'}, ${tr} row${tr==1?'':'s'}.)`
		const ds=font_textsize(FONT_BODY,desc);draw_text_fit(rect(xo+tw-ds.x,bh,w,fh),desc,FONT_BODY,1)
		draw_box(rect(xo,0,cx-xo,bh),0,1);if(ve)draw_vline(cx-1,0,bh,13)
	}
	else if(image_is(x)){
		const s=x.size, desc=`(${s.x} x ${s.y})`, ds=font_textsize(FONT_BODY,desc), mh=max(1,min(s.y,size.y-font_h(FONT_BODY))), mw=max(1,min(s.x,w))
		const scale=s.x==0&&s.y==0?1:min(mw/(s.x*1.0),mh/(s.y*1.0)), iw=0|(scale*s.x), ih=0|(scale*s.y), b=rect((xo-2)+(w-max(iw,ds.x)),0,iw+2,ih+2)
		draw_scaled(inset(b,1),x,1),draw_box(b,0,1),draw_text(rect(b.x,b.y+b.h,ds.x,ds.y),desc,FONT_BODY,1)
	}
	else{const l=layout_plaintext(bare?ls(x): show(x,0),FONT_MONO,align,rect(w,size.y));draw_text_wrap(rect(xo,0,w,size.y),l,1)}
	for(let y=size.y-1;y>0;y--){let f=0;for(let x=0;x<size.x;x++)if(r.pix[x+(y*size.x)]){f=1;break}if(f){break}else{r.size.y--}}
	return frame=t,r
}
export const unpack_widget=x=>({
	size  :rpair(getpair(ifield(x,'pos')),getpair(ifield(x,'size'))),
	show  :ls(ifield(x,'show'  )),
	locked:lb(ifield(x,'locked')),
})
export const unpack_button=x=>({
	size    :rpair(getpair(ifield(x,'pos')),getpair(ifield(x,'size'))),
	text    :ls(ifield(x,'text'  )),
	font    :   ifield(x,'font'  ) ,
	style   :ls(ifield(x,'style' )),
	show    :ls(ifield(x,'show'  )),
	locked  :lb(ifield(x,'locked')),
	shortcut:ls(ifield(x,'shortcut')),
})
export const unpack_slider=x=>({
	size  :rpair(getpair(ifield(x,'pos')),getpair(ifield(x,'size'))),
	font  :   ifield(x,'font'  ) ,
	format:ls(ifield(x,'format')),
	show  :ls(ifield(x,'show'  )),
	style :ls(ifield(x,'style' )),
	locked:lb(ifield(x,'locked')),
	step  :ln(ifield(x,'step'  )),
	value :ln(ifield(x,'value' )),
	min   :getpair(ifield(x,'interval')).x,
	max   :getpair(ifield(x,'interval')).y,
})
export const unpack_canvas=x=>({
	size     :rpair(getpair(ifield(x,'pos')),getpair(ifield(x,'size'))),
	scale    :ln(ifield(x,'scale'    )),
	border   :lb(ifield(x,'border'   )),
	draggable:lb(ifield(x,'draggable')),
	show     :ls(ifield(x,'show'     )),
	locked   :lb(ifield(x,'locked'   )),
})
export const unpack_field=x=>({
	size     :rpair(getpair(ifield(x,'pos')),getpair(ifield(x,'size'))),
	font     :   ifield(x,'font'     ) ,
	show     :ls(ifield(x,'show'     )),
	scrollbar:lb(ifield(x,'scrollbar')),
	border   :lb(ifield(x,'border'   )),
	style    :ls(ifield(x,'style'    )),
	locked   :lb(ifield(x,'locked'   )),
	align    :ALIGN[ls(ifield(x,'align'))],
})
export const unpack_field_value=x=>({
	table :   ifield(x,'value' ) ,
	scroll:ln(ifield(x,'scroll')),
})
export const unpack_grid=x=>({
	size     :rpair(getpair(ifield(x,'pos')),getpair(ifield(x,'size'))),
	widths   :ll(ifield(x,'widths')).map(ln),
	font     :   ifield(x,'font'     ) ,
	format   :ls(ifield(x,'format'   )),
	headers  :lb(ifield(x,'headers'  )),
	scrollbar:lb(ifield(x,'scrollbar')),
	lines    :lb(ifield(x,'lines'    )),
	bycell   :lb(ifield(x,'bycell'   )),
	show     :ls(ifield(x,'show'     )),
	locked   :lb(ifield(x,'locked'   )),
})
export const unpack_grid_value=x=>({
	table :   ifield(x,'value' ) ,
	scroll:ln(ifield(x,'scroll')),
	row   :ln(ifield(x,'row'   )),
	col   :ln(ifield(x,'col'   )),
})

let cursor={default:'default',point:'pointer',ibeam:'text',drag:'grabbing'}
export const image_tiles=(count,size,image)=>range(count).map(x=>image_copy(image,rect(0,x*size,size,size)))
export const TOOLS=image_tiles(12,16,image_read(
	'%%IMG0ABAAwAMABIAEgASABIAEgGTwlKxMqiQKJAIQAggCCAQEBAQEAAAAAAAAAAA//EACgAGAAYABgAFAAz/+H/wAAAAAAA'+
	'AAAAAA8+eAAYABAAAAAIABgAGAAQAAAACAAYAB588AAADwAIgBCAGQAnACIAQgBEAIQAiAEIARAB4AHAAYABAAAAAAAAP4HA'+
	'YgAUABgAGAAoAcuOBnAFQAOAAIAAgAEAAAAAAAAADAADAADAADAADAADAADAADAAAAAAAAAAAAAAcACIAJgArADLAInBCOIU'+
	'dAh4APgBdAJyBHEIcJBgYEAAAAADgcVjar69VVqqvVVaqrVVZqrDVYGrAHwAAAAAAAAAAA//+AAYABgAGAAYABgAGAAYABgA'+
	'H//wAAAAAAAAAAAAD//6qr1VWqq9VVqqvVVaqr1VWqq///AAAAAAAAAAAAAAAAB+AYGCAEQAKAAYABgAFAAiAEGBgH4AAAAA'+
	'AAAAAAAAAH4B1YKqxVVqqr1VWqq1VWKqwdWAfgAAAAAA=='
))
export const ARROWS=image_tiles(8,12,image_read(
	'%%IMG0AAwAYAAABgAJARCCIERAL/DxEIEQgRCBH4AAAAABH4EQgRCBEI/w9EAiIEEQgAkABgAAAAAABgAPAR+DP8d/7//xH4'+
	'EfgR+BH4AAAAABH4EfgR+BH4//93/jP8EfgA8ABgAAAAIABgAKARPiICRAJEAiICET4AoABgACAAQABgAFB3yEQERAJEAkQE'+
	'd8gAUABgAEAAIABgAOAR/jP+d/53/jP+Ef4A4ABgACAAQABgAHB3+Hf8d/53/nf8d/gAcABgAEAA=='
))
export const CHECK=image_read('%%IMG0AAkABwCAAcGDY8Y2bBw4CBAA')
export const CHECKS=[
	'%%IMG0AA8ADQAAf/BAEEAQQBBAEEAQQBBAEEAQQBB/8AAA',
	'%%IMG0AA8ADQAAf/BgMFBQSJBFEEIQRRBIkFBQYDB/8AAA',
	'%%IMG0AA8ADQAAVVAAAEAQAABAEAAAQBAAAEAQAABVUAAA',
	'%%IMG0AA8ADQAAVVAgIFBQCIBFEAIARRAIgFBQICBVUAAA',
].map(image_read)
export const LOCK     =image_read('%%IMG0AAgACDhERP7+/v4A')
export const ANIM     =image_read('%%IMG0AAgACBAoKER8goIA')
export const ZOOM     =image_read('%%IMG0AAwADB4AIQBMgIxAv0C/QIxATIAhwB7gAHAAMA==')
export const CORNERS=['%%IMG0AAUABf/mxISA','%%IMG0AAUABfk4GAgI','%%IMG0AAUABYSGx+f4','%%IMG0AAUABQgIGT/4'].map(image_read)
export const GESTURES={
	left: image_read('%%IMG2ABAAEAAaIAQACiADAQIgAQAIIAMBBCABAAYgAwEGIAEABCADAQggBgEMIAIBDiAEAQwgAQACIAMBCCADAAQgAwEGIAEACCADAQQgAQAKIAMBAiABAAwgBAAi'),
	right:image_read('%%IMG2ABAAEAASIAQADCABAQIgAwAKIAEBBCADAAggAQEGIAMABCADAQggAwACIAEBDCAEAQ4gAgEMIAYBCCADAAQgAQEGIAMABiABAQQgAwAIIAEBAiADAAogBAAq'),
	up:   image_read('%%IMG2ABAAEAAHIAMADSABAQEgAQAMIAIBASACAAsgAQEDIAEACiACAQMgAgAJIAEBBSABAAggAgEFIAIAByABAQcgAQAGIAIBByACAAUgAQEJIAEABCACAQkgAgADIAEBCyABAAMgAQELIAEAAyAFAQMgBQAHIAEBAyABAAsgBQAF'),
	down: image_read('%%IMG2ABAAEAAFIAUACyABAQMgAQAHIAUBAyAFAAMgAQELIAEAAyABAQsgAQADIAIBCSACAAQgAQEJIAEABSACAQcgAgAGIAEBByABAAcgAgEFIAIACCABAQUgAQAJIAIBAyACAAogAQEDIAEACyACAQEgAgAMIAEBASABAA0gAwAH'),
}
export const RADIOS=[
	'%%IMG0ABAADgAAB4AYYCAQIBBACEAIQAhACCAQIBAYYAeAAAA=',
	'%%IMG0ABAADgAAB4Af4DhwMDBgGGAYYBhgGDAwOHAf4AeAAAA=',
	'%%IMG0ABAADgAAAAAAAAAAB4APwA/AD8APwAeAAAAAAAAAAAA=',
	'%%IMG0ABAADgAAB4Af4D/wP/B/+H/4f/h/+D/wP/Af4AeAAAA=',
].map(image_read)
export const ICONS=[
	'%%IMG0AAwADAAAAAM8BEPkQBRAFEAUQBRAFEAXf/AAAA==',
	'%%IMG0AAwADAABHwERgRFBEeEQIRAhECEQIRAhH+AAAA==',
	'%%IMG0AAwADAAAAgAGQA4jPqM+oz6gDiAGQAIAAAAAAA==',
	'%%IMG0AAwADAABH4EfwAHBH8M/wznDOcM5wz/hH+AAAA==',
	'%%IMG0AAwADAAAAgAFAAiBEEIjpERSLiEScAnwBWACAA==',
	'%%IMG0AAwADAAAAAEf4RShF6EUoRShF6EQoR/gAAAAAA==',
	'%%IMG0AAwADAABFUIqoRVCKqEVQiqhFUIqoRVCKqAAAA==',
	'%%IMG0AAwADAAAAAAAIABgAMRBhmMDNgEcAAgAAAAAAA==',
].map(image_read)
export const HANDLES=[
	'%%IMG2AAcACgABAQUAAQEBIAUBAiAFAQIgBQECIAUBAiAFAQIgBQEBAAEBASADAQEAAwEBIAEBAQAFAQEAAw==',
	'%%IMG2AAoABwABAQYAAwEBIAYBAQACAQEgBwEBAAEBASAIAQIgBwEBAAEBASAGAQEAAwEGAAM=',
].map(image_read)
export const ICON={dir:0,doc:1,sound:2,font:3,app:4,lil:5,pat:6,chek:7,none:8}
export const PANGRAM='How razorback jumping-frogs can level six piqued gymnasts.'

// State

let uimode='interact', ui_container=null, uicursor=0, enable_touch=0, set_touch=0, toolbar_scroll=0
let profiler=0, profiler_ix=0, profiler_hist=new Uint8Array(200)
export const mark_dirty=_=>{dirty=1}
export const con_set=x=>{
	if(x!=ui_container)setmode(uimode),msg.next_view=1
	if(x!=ui_container&&prototype_is(ui_container))contraption_update(deck,ui_container);ui_container=x
}
export const con=_=>ui_container?ui_container:ifield(deck,'card')
export const con_wids=_=>con().widgets
export const con_image=_=>ifield(con(),'image')
export const con_size=_=>getpair(ifield(con(),'size'))
export const con_dim=_=>rpair(rect(),con_size())
export const con_clip=_=>{const size=con_size();return dr.fatbits?rcenter(frame.clip,rmin(frame.size,rmul(size,dr.zoom))): rclip(frame.clip,rcenter(frame.clip,size))}
export const con_offset=_=>{const r=con_clip();return rect(r.x,r.y)}
export const con_to_screen=a=>radd(dr.fatbits?rmul(rsub(a,dr.offset),dr.zoom):a,con_offset())
export const screen_to_con=a=>{a=rsub(a,con_offset());return dr.fatbits?radd(rdiv(a,dr.zoom),dr.offset):a}
export const con_view_dim=_=>{const a=screen_to_con(rect(0,0)),b=screen_to_con(frame.size);return rpair(a,rsub(b,a))}
export const clamp_fatbits=_=>{dr.offset=rclamp(rect(0,0),dr.offset,rmax(rsub(con_size(),rdiv(frame.size,dr.zoom)),rect(0,0)))}
export const center_fatbits=p=>{dr.offset=rsub(p,rdiv(rdiv(frame.size,dr.zoom),2)),clamp_fatbits()}
export const ev_to_con=e=>{e.pos=screen_to_con(e.opos=rcopy(e.pos)),e.dpos=screen_to_con(e.odpos=rcopy(e.dpos)),pointer.prev=screen_to_con(pointer.prev);return e}
export const con_to_ev=e=>{e.pos=e.opos,e.dpos=e.odpos,pointer.prev=con_to_screen(pointer.prev);return e}
export const tracking=_=>{
	const c=con()
	if(prototype_is(c)){
		const defs=deck.contraptions, i=dkix(defs,ifield(c,'name')), n=count(defs)
		if(ev.dir=='left' )con_set(defs.v[(i+(n-1))%n])
		if(ev.dir=='right')con_set(defs.v[(i+1    )%n])
	}
	if(card_is(c)){
		if(ev.dir=='left' )n_go([lms('Prev')],deck)
		if(ev.dir=='right')n_go([lms('Next')],deck)
	}
}
export const is_fullscreen=_=>(document.fullscreenElement||document.webkitFullscreenElement)!=null
export const toggle_fullscreen=_=>{
	if(is_fullscreen()){
		if(document.exitFullscreen)document.exitFullscreen()
		if(document.webkitExitFullscreen)document.webkitExitFullscreen()
	}else{
		const e=q('#decker_root'), o={navigationUI:'hide'}
		if(e.requestFullscreen)e.requestFullscreen(o)
		if(e.webkitRequestFullscreen)e.webkitRequestFullscreen(o)
	}setTimeout(resize,500)
}
export const set_fullscreen=x=>{
	const i=is_fullscreen()
	if(i&&!x){toggle_fullscreen()}
	else if(!i&&x){modal_enter('fullscreen_lil')}
}
export const setmode=mode=>{
	n_play([NONE,lms('loop')])
	grid_exit(),field_exit(),bg_end_selection(),bg_end_lasso(),ob.sel=[],wid.active=-1,sc.others=[],dr.poly=[]
	msg.next_view   =(uimode!=mode)&&mode=='interact'
	msg.pending_loop=(uimode!=mode)&&mode=='interact'
	uimode=mode;if(mode!='interact')msg.pending_halt=1;if(mode!='draw'&&!prototype_is(con()))dr.fatbits=0;if(mode=='interact')dr.fatbits=0
}

export const event_state=_=>({ // event state
	mu:0,md:0, clicktime:0,click:0,rdown:0,rup:0, dclick:0, clicklast:0, down_modal:0, down_uimode:0, down_caps:0,
	drag:0, tab:0, shift:0, alt:0, action:0, dir:0, exit:0, eval:0, scroll:0, hidemenu:0,
	pos:rect(), dpos:rect(), rawpos:rect(), rawdpos:rect(), shortcuts:{}, opos:rect(),odpos:rect(),
	callback:null, callback_rect:null, callback_drag:0
})
let ev=event_state()
export const over=r=>rin(r,ev.pos)
export const dover=r=>rin(r,ev.dpos)

export const wid_state=_=>({ // widget state
	active:0,count:0, scrolls:0,thumbid:0,thumbo:0, col_drag:0,col_num:0,col_orig:0,
	ingrid:0,g:null,gt:null,gv:null,pending_grid_edit:0,
	infield:0,f:null,ft:null,fv:null,field_dirty:0,change_timer:0,
	cursor:rect(),cursor_timer:0,
	hist:[],hist_cursor:0,
})
export const wid_state_clone=x=>{const r=Object.assign({},x);r.cursor=rcopy(r.cursor),r.hist=r.hist.slice(0);return r}
let wid=wid_state()
export const modal_state=_=>({ // modal state
	type:null,subtype:null,in_modal:0,edit_json:0,old_wid:null,
	filter:0, grid:null,grid2:null, text:null,name:null,form0:null,form1:null,form2:null,
	desc:'',path:'',path_suffix:'',filter:'', message:null,verb:null, cell:rect(),
	from_listener:0,from_action:0,from_keycaps:0, act_go:0,act_card:0,act_gomode:0,act_trans:0,act_transo:0,act_sound:0,
	time_curr:0,time_end:0,time_start:0, carda:null,cardb:null,trans:null,canvas:null,pending_grid_cell:rect(),
})
export const modal_state_clone=x=>{const r=Object.assign({},x);r.cell=rcopy(r.cell);return r}
let ms=modal_state(), ms_stack=[]
export const modal_push=type=>{if(ms.type){ms_stack.push({ms:modal_state_clone(ms),wid:wid_state_clone(wid)})}modal_enter(type)}
export const modal_pop=value=>{
	const l=ms.type=='link'&&value?rtext_string(ms.text.table):null
	modal_exit(value);if(ms_stack.length){const c=ms_stack.pop();ms=c.ms,wid=c.wid}
	if(l){const c=rcopy(wid.cursor);field_stylespan(lms(''),l),wid.cursor=c}
}
let kc={shift:0,lock:0,on:0,heading:null}, keydown={},keyup={}
export const keycaps_enter=_=>{if(!enable_touch||kc.on)return;kc.shift=0,kc.lock=0,kc.on=1,ev.mu=ev.md=0}

let msg={ // interpreter event messages
	pending_drag:0,pending_halt:0,pending_view:0,pending_loop:0,next_view:0,overshoot:0,
	target_click:null,target_drag:null,target_release:null,target_order:null,target_run:null,target_link:null,target_ccell:null,target_change:null,target_navigate:null,
	arg_click:rect(),arg_drag:rect(),lastdrag:rect(),arg_release:rect(),arg_order:null,arg_run:null,arg_link:null,arg_ccell:null,arg_change:null,arg_navigate:null,
}
let li={hist:[],vars:new Map(),scroll:0} // listener state
let ob={sel:[],show_bounds:1,show_names:0,show_cursor:0,show_margins:0,show_guides:1,move:0,move_first:0,resize:0,resize_first:0,handle:-1,prev:rect(),orig:rect()} // object editor state
let sc={target:null,others:[],next:null, f:null,prev_mode:null,xray:0,status:''} // script editor state
export const script_save=x=>{const k=lms('script');mark_dirty();if(sc.target)iwrite(sc.target,k,x);if(sc.others)sc.others.map(o=>iwrite(o,k,x))}

export const draw_state=_=>({ // drawing tools state
	tool:'pencil',brush:0,pattern:1,fill:0,erasing:0, dither_threshold:0,
	show_widgets:1,show_anim:1,trans:0,trans_mask:0,under:0,color:0,fatbits:0,offset:rect(),
	show_grid:0,snap:0,grid_size:rect(16,16), sel_here:rect(),sel_start:rect(),limbo:null,limbo_dither:0,
	scratch:null,mask:null,omask:null, pickfill:0, poly:[], zoom:4, lasso_dirty:0,
})
let dr=draw_state()
export const settool=tool=>{setmode('draw'),dr.tool=tool}
export const bg_pat=_=>(dr.trans_mask&&dr.pattern==0)?32:dr.pattern
export const bg_fill=_=>(dr.trans_mask&&dr.fill==0)?32:dr.fill
export const bg_has_sel=_=>dr.tool=='select'&&(dr.sel_here.w>0||dr.sel_here.h>0)
export const bg_has_lasso=_=>dr.tool=='lasso'&&dr.mask!=null
export const sint=(x,a)=>a*(0|((0|(x+a/2))/a))
export const snap=p=>!dr.snap?p:rect(sint(p.x,dr.grid_size.x),sint(p.y,dr.grid_size.y),p.w,p.h) // position only
export const snapr=r=>rpair(snap(r),snap(rect(r.w,r.h))) // position + dimensions
export const snap_delta=p=>{const a=snap(p);return rect(a.x-p.x,a.y-p.y)}

let au={target:null,mode:'stopped', head:0,sel:rect(), hist:[],hist_cursor:0, clip:null,tick:null, record_stream:null,norecord:0} // audio editor state
export const byte_to_sample=b=>(b<<24>>24)/128
export const sample_to_byte=s=>0xFF&clamp(-127,s*128,127)

// Menus

const menu={heads:[],items:[],x:0,active:-1,stick:-1,lw:-1,sz:rect()}
export const no_menu=_=>menu.active==-1&&menu.stick==-1
export const in_layer=_=>no_menu()&&(ms.type?ms.in_modal:1)&&((!running()&&!msg.overshoot)||ms.type!=null)
export const in_widgets=_=>ms.type!=null?ms.in_modal:1
export const menus_off=_=>lb(ifield(deck,'locked'))
export const menus_hidden=_=>uimode=='draw'&&ev.hidemenu&&ms.type==null
export const menu_head=(name,enabled,t,b)=>({name,enabled,t,b}) // string,bool,rect,rect
export const menu_entry=(name,enabled,check,shortcut,t,b)=>({name,enabled,check,shortcut,t,b}) // string,bool,bool,char,rect,rect
export const menus_clear=_=>(menu.active=-1,menu.stick=-1)
export const menu_setup=_=>(menu.x=10,menu.heads=[],menu.sz=rect(),menu.active=-1)
export const menu_bar=(name,enabled)=>{
	if(menus_off())enabled=0
	const t=rpair(rect(menu.x,2),font_textsize(FONT_MENU,name)), b=rect(t.x-5,0,t.w+10,t.h+3), i=menu.heads.length
	menu.heads.push(menu_head(name,enabled,t,b)), menu.x=b.x+b.w+5; if(menus_hidden())return
	if(ev.click&&enabled&&over(b)){ev.mu=0;if(menu.stick==-1)menu.stick=i}
	if(menu.stick!=-1&&enabled&&over(b))menu.stick=i,menu.lw=0
	if(menu.stick==-1){
		if(ev.drag&&enabled&&over(b)&&ev.dpos.y<b.h)ev.dpos=ev.pos,menu.lw=0
		if((ev.drag||ev.mu)&&enabled&&rin(b,ev.dpos))menu.active=i
	}if(i==menu.active||i==menu.stick)menu.sz=rect(b.x,b.h,max(b.w,menu.lw),0),menu.items=[]
	if(ev.md&&over(b)&&enabled)ev.md=0
}
export const shortcut_w=c=>!c?0: 10+font_textsize(FONT_MENU,'^'+c).x
export const menu_check=(name,enabled,check,shortcut,func)=>{
	if(!last(menu.heads).enabled)return 0
	const sc=enabled&&shortcut&&ev.shortcuts[shortcut]; if(sc)delete ev.shortcuts[shortcut];
	if(menu.heads.length-1!=menu.active&&menu.heads.length-1!=menu.stick)return sc
	const t=name?rpair(rect(menu.sz.x+5+8,menu.sz.y+menu.sz.h+2),font_textsize(FONT_MENU,name)): rect(menu.sz.x,menu.sz.y+menu.sz.h+2,1,1)
	if(shortcut)t.w+=shortcut_w(shortcut)
	const b=rect(menu.sz.x,menu.sz.y+menu.sz.h,max(menu.sz.w,t.w+10+8),t.h+4)
	menu.items.push(menu_entry(name,enabled,check,shortcut,t,b)), menu.sz=runion(menu.sz,b)
	if(enabled&&over(b)&&func)ev.callback=func,ev.callback_rect=rcopy(b),ev.callback_drag=1
	return sc||(enabled&&ev.mu&&over(b))
}
export const menu_item=(name,enabled,shortcut,func)=>menu_check(name,enabled,-1,shortcut,func)
export const menu_separator=_=>menu_check(0,0,0,0,0)
export const menu_finish=_=>{
	if(menus_off()||menus_hidden())return
	const b=rect(0,0,context.size.x,3+font_h(FONT_MENU)); draw_rect(b,32),draw_hline(0,b.w,b.h,1); const pal=deck.patterns.pal.pix
	menu.heads.map((x,i)=>{
		let a=x.enabled&&(over(x.b)||i==menu.stick||i==menu.active);if(ev.drag&&!dover(b))a=0
		draw_text(x.t,x.name,FONT_MENU,x.enabled?1:13);if(a)draw_invert(pal,x.b)
	})
	if(!menu.sz.w)return
	draw_shadow(menu.sz,1,32,1);menu.lw=0;let sw=0;menu.items.map(x=>{menu.lw=max(menu.lw,x.b.w),sw=max(sw,shortcut_w(x.shortcut))})
	menu.items.map(x=>{
		const o=over(x.b)&&x.name&&x.enabled
		if(x.name){draw_text(x.t,x.name,FONT_MENU,x.enabled?1:13)}else{draw_rect(rect(x.t.x+2,x.t.y,menu.sz.w-5,1),19)}
		if(x.check==1)draw_icon(rect(menu.sz.x+2,x.t.y+3),CHECK,x.enabled?1:13)
		if(x.shortcut)draw_text(rect(menu.sz.x+menu.sz.w-3-sw+10,x.t.y),'^'+x.shortcut,FONT_MENU,x.enabled?1:13)
		if(o)draw_invert(pal,inset(x.b,1))
	});if(ev.mu)menu.stick=-1
}

// Widgets

export const widget_setup=_=>{
	if(ev.mu||wid.active==-1)wid.col_drag=0;if(wid.active>=wid.count)wid.active=0
	if((uimode=='interact'||ms.type!=null)&&ev.tab&&wid.count&&!(wid.infield&&wid.f.style=='code')&&!kc.on){
		if(wid.ingrid)grid_exit()
		if(wid.infield)field_exit()
		wid.active+=ev.shift?-1:1
		if(wid.active<0)wid.active+=wid.count;wid.cursor=rect()
	}
	if(uimode!='interact'&&uimode!='script'&&ms.type==null){
		if(wid.ingrid ||wid.gv!=null)grid_exit()
		if(wid.infield||wid.fv!=null)field_exit()
		wid.active=-1
	}wid.count=0,wid.scrolls=0,wid.ingrid=0,wid.infield=0
}

export const scrollbar=(r,n,line,page,scroll,visible,inverted)=>{
	const addscroll=x=>scroll=clamp(0,scroll+x,n)
	addscroll(0);const sz=ARROWS[0].size.x+2, fcol=!in_layer()?13:inverted?32:1, bcol=inverted?1:32
	const b=rect(r.x+r.w-sz-2,r.y,sz+2,r.h), rr=rect(r.x+1,r.y,visible?r.w-b.w-1:r.w-2,r.h-2), pal=deck.patterns.pal.pix
	let dragging_thumb=(wid.thumbid==wid.scrolls++)&&dover(b)
	if(visible){
		draw_box(b,0,fcol)
		arrow=(bb,base,dir)=>{
			const a=n>0&&over(bb)&&!dragging_thumb, o=a&&(ev.mu||ev.drag)&&dover(r)
			draw_box(bb,0,fcol),draw_icon(rect(bb.x+2,bb.y+2),ARROWS[base+(o?2:0)],fcol)
			if(o&&ev.md)addscroll(line*dir);if(a&&!ev.drag)uicursor=cursor.point
		}
		arrow(rect(b.x,b.y         ,sz+2,sz+2),0,-1)
		arrow(rect(b.x,b.y+b.h-sz-2,sz+2,sz+2),1, 1)
		if(n<=0||!in_layer())return {size:rr,scroll}
		const s=rect(b.x+1,b.y+sz+2,b.w-2,b.h-2*(sz+2));draw_rect(s,inverted?9:12)
		const thumb_height=0|max(16,s.h/(1+n)), thumb_y=0|((s.h-thumb_height)*(scroll/n)), thumb=rect(s.x,s.y+thumb_y,s.w,thumb_height)
		if(in_layer()&&ev.md&&over(thumb)){wid.thumbid=wid.scrolls-1,wid.thumbo=ev.dpos.y-thumb.y,dragging_thumb=1}
		if(in_layer()&&ev.drag&&dragging_thumb){
			const capped=max(s.y,min(s.y+s.h-thumb.h,ev.pos.y-wid.thumbo))-s.y
			thumb.y=capped+s.y,scroll=max(0,0|min((capped/(s.h-thumb_height))*n,n)),uicursor=cursor.drag
		}
		if(in_layer()&&ev.mu&&dragging_thumb)wid.thumbid=-1
		draw_rect(thumb,bcol),draw_box(thumb,0,fcol)
		inner=(bb,dir)=>{
			if(!dragging_thumb&&over(bb))uicursor=cursor.point
			if(!dragging_thumb&&ev.mu&&over(bb))draw_invert(pal,bb),addscroll(page*dir)
		}
		if(thumb_y>0          )inner(rect(s.x,s.y                ,s.w,     thumb_y         ),-1)
		if(thumb_y+thumb.h<s.h)inner(rect(s.x,s.y+thumb_y+thumb.h,s.w,s.h-(thumb_y+thumb.h)), 1)
	}
	if(in_layer()&&over(runion(r,b))&&ev.scroll)addscroll(ev.scroll*line)
	return {size:rr,scroll}
}

export const widget_button=(target,x,value,func)=>{
	const l=x.locked||!in_layer(), pal=deck.patterns.pal.pix, font=x.font||FONT_MENU;let b=x.size
	const fcol=l?13:x.show=='invert'?32:1, bcol=x.show=='invert'?1:32, scol=x.show=='invert'?32:1
	const sel=!l&&x.show!='none'&&x.style!='invisible'&&wid.active==wid.count
	let sh=0,shh=0;if(!l&&uimode=='interact'&&!wid.fv&&!ev.shift&&x.show!='none'&&x.shortcut){if(keyup[x.shortcut]){shh=1}else if(keydown[x.shortcut]){sh=1}}
	const a=!l&&dover(b)&&over(b), cs=sel&&!func&&ev.action, cl=cs||sh||((ev.md||ev.drag)&&a), cr=cs||shh|(ev.mu&&a)
	if(func&&a){ev.callback=func,ev.callback_rect=rcopy(b)}
	if(!l&&over(b)&&!ev.drag&&x.show!='none')uicursor=cursor.point
	if(x.show=='none')return 0; let ar=inset(b,2)
	if(x.style=='round'){
		draw_boxr(b,fcol,bcol,x.show!='transparent')
		draw_textc(inset(b,3),x.text,font,fcol)
		if(sel)draw_box(ar,0,13);if(cl)draw_invert(pal,ar)
	}
	if(x.style=='rect'){
		if(cl){b=rect(b.x+1,b.y+1,b.w-1,b.h-1),ar=rect(ar.x+1,ar.y+1,ar.w-1,ar.h-1);if(x.show!='transparent')draw_rect(b,bcol);draw_box(b,0,fcol)}
		else  {b=rect(b.x  ,b.y  ,b.w-1,b.h-1),ar=rect(ar.x  ,ar.y  ,ar.w-1,ar.h-1);draw_shadow(b,fcol,bcol,x.show!='transparent')}
		draw_textc(inset(b,3),x.text,font,fcol);if(sel)draw_box(ar,0,13)
	}
	if(x.style=='check'||x.style=='radio'){
		if(x.show!='transparent')draw_rect(b,bcol)
		const ts=font_textsize(font,x.text), cdim=(x.style=='check'?CHECKS[0]:RADIOS[0]).size, bh=max(ts.y,cdim.y)
		const br=rect(b.x,b.y+(0|((b.h-bh)/2)),b.w,bh), to=rclip(b,rect(br.x+cdim.x,0|(br.y+(br.h-ts.y)/2),b.w-cdim.x,ts.y))
		draw_rect(rect(br.x+1,br.y+1,cdim.x-4,cdim.y-3),bcol)
		if(x.style=='check'){draw_icon(rect(br.x,br.y),CHECKS[(value^(cl||cr))+2*x.locked],scol)}
		else{const p=rect(br.x,br.y);draw_icon(p,RADIOS[3],bcol),draw_icon(p,RADIOS[cl||cr?1:0],fcol);if(value)draw_icon(p,RADIOS[2],fcol)}
		draw_text_fit(to,x.text,font,fcol);ar=to;if(sel)draw_box(rect(to.x-2,to.y-1,to.w+2,to.h+2),0,13);if(cl)draw_invert(pal,ar)
	}
	if(x.style=='invisible'){draw_textc(inset(b,3),x.text,font,fcol);if(cl&&x.show!='transparent')draw_invert(pal,ar)}
	if(target&&cr)msg.target_click=target
	if(!x.locked&&in_widgets())wid.count++
	return cr
}

export const widget_slider=(target,x)=>{
	const l=x.locked||!in_layer(), pal=deck.patterns.pal.pix, font=x.font||FONT_MENU
	let b=x.size, fcol=l?13:x.show=='invert'?32:1, bcol=x.show=='invert'?1:32, bpat=x.show=='invert'?9:12
	const sel=!l&&x.show!='none'&&wid.active==wid.count, ov=x.value
	if(x.show=='none')return
	const t=ls((x.style=='bar'||x.style=='compact')?dyad.format(lms(x.format),lmn(x.value)):lms(''))
	const oc=frame.clip; frame.clip=rclip(b,frame.clip)
	const hv_btn=(bb,dir,ba)=>{
		const a=!l&&over(bb), o=a&&(ev.mu||ev.drag)&&dover(bb)
		if(o&&ev.md)x.value+=(dir*x.step); if(a)uicursor=cursor.point
		draw_rect(bb,bcol),draw_box(bb,0,fcol),draw_icon(rint(rect(bb.x+(bb.w-12)/2,bb.y+(bb.h-12)/2)),ARROWS[ba+(o?2:0)],fcol)
	}
	const hv_tsz=(axis,tf,av,as)=>{
		let drag=(wid.thumbid==wid.scrolls++)&&dover(b),
		n=0|((x.max-x.min)/x.step), ts=0|max(min(axis,16),axis/(1+n)), tp=0|(((x.value-x.min)/max(1,(x.max-x.min)))*(axis-ts)), thumb=rint(tf(tp,ts))
		if(!l){
			if(ev.md&&over(thumb))wid.thumbid=wid.scrolls-1,wid.thumbo=ev.dpos[av]-thumb[av],drag=1
			if(ev.drag&&drag){
				const capped=max(b[av],min(b[av]+b[as]-thumb[as],ev.pos[av]-wid.thumbo))-b[av]
				thumb[av]=capped+b[av],uicursor=cursor.drag,x.value=x.min+capped*((x.max-x.min)/(b[as]-ts))
			}if(ev.mu&&drag)wid.thumbid=-1
		}draw_rect(thumb,bcol),draw_box(thumb,0,fcol);return {drag,thumb}
	}
	const hv_gap=(drag,bb,dir)=>{if(!l&&!drag&&over(bb)){uicursor=cursor.point;if(ev.mu)draw_invert(pal,bb),x.value+=(dir*10*x.step);}}
	if(x.style=='horiz'||x.style=='vert'){if(x.show!='transparent')draw_rect(b,bpat);draw_box(b,0,sel?13:fcol)}
	if(x.style=='horiz'){
		hv_btn(rect(b.x,b.y,16,b.h),-1,4),hv_btn(rect(b.x+b.w-16,b.y,16,b.h),1,5),b=rect(b.x+16,b.y+1,b.w-32,b.h-2)
		const a=hv_tsz(b.w,(tp,ts)=>rect(b.x+tp,b.y,ts,b.h),'x','w'), drag=a.drag, thumb=a.thumb
		hv_gap(drag,rect(b.x,b.y,thumb.x-b.x,b.h),-1),hv_gap(drag,rect(thumb.x+thumb.w,b.y,b.w-(thumb.x+thumb.w-b.x),b.h),1)
	}
	if(x.style=='vert'){
		hv_btn(rect(b.x,b.y,b.w,16),-1,0);hv_btn(rect(b.x,b.y+b.h-16,b.w,16),1,1),b=rect(b.x+1,b.y+16,b.w-2,b.h-32)
		const a=hv_tsz(b.h,(tp,ts)=>rect(b.x,b.y+tp,b.w,ts),'y','h'), drag=a.drag, thumb=a.thumb
		hv_gap(drag,rect(b.x,b.y,b.w,thumb.y-b.y),-1),hv_gap(drag,rect(b.x,thumb.y+thumb.h,b.w,b.h-(thumb.y+thumb.h-b.y)),1)
	}
	if(x.style=='bar'){
		fcol=x.locked?(x.show=='invert'?32:1):fcol
		if(x.show!='transparent')draw_rect(b,bcol);draw_box(b,0,sel?13:fcol)
		b=inset(b,2),draw_textc(b,t,font,fcol);if(!l&&over(b))uicursor=cursor.point
		const f=(x.max==x.min)?0:((x.value-x.min)/(x.max-x.min))*b.w;draw_invert(pal,rect(b.x,b.y,0|f,b.h))
		if(!l&&dover(b)&&(ev.md||ev.drag)){x.value=x.min+(ev.pos.x-b.x)*((x.max-x.min)/b.w),uicursor=cursor.drag}
	}
	if(x.style=='compact'){
		if(x.show=='transparent')draw_rect(rect(b.x+1,b.y+1,13,b.h-2),bcol),draw_rect(rect(b.x+b.w-14,b.y+1,13,b.h-2),bcol)
		draw_boxr(b,fcol,bcol,x.show!='transparent'),draw_textc(rect(b.x+14,b.y,b.w-28,b.h),t,font,fcol)
		const comp_btn=(xo,dir,ba,li,en)=>{
			const bb=rect(b.x+xo,b.y,14,b.h), a=en&&!l&&over(bb), o=a&&(ev.mu||ev.drag)&&dover(bb)
			if(o&&ev.md)x.value+=(dir*x.step); if(a)uicursor=cursor.point
			draw_icon(rect(bb.x+1,0|(b.y+(b.h-12)/2)),ARROWS[ba+(o?2:0)],en?fcol:13),draw_vline(bb.x+li,b.y+1,b.y+b.h-1,sel?13:fcol)
		};comp_btn(0,-1,4,13,x.value!=x.min),comp_btn(b.w-14,1,5,0,x.value!=x.max)
	}
	if(sel&&ev.dir=='up')x.value-=x.step;if(sel&&ev.dir=='down')x.value+=x.step
	if(in_layer()&&over(frame.clip)&&ev.scroll)x.value+=x.step*ev.scroll; x.value=slider_normalize(target,x.value)
	if(target&&Math.abs(ov-x.value)>(x.step/2)){msg.target_change=target,msg.arg_change=lmn(x.value);iwrite(target,lms('value'),msg.arg_change),mark_dirty()}
	if(!x.locked&&in_widgets())wid.count++
	frame.clip=oc
}

export const widget_canvas=(target,x,image)=>{
	if(x.show=='none')return; const b=x.size, pal=deck.patterns.pal.pix
	if(x.show=='solid'){if(image){draw_scaled(b,image,1)}else{draw_rect(b,0)}}
	if(image&&x.show=='transparent')draw_scaled(b,image,0)
	if(image&&x.show=='invert')draw_invert_scaled(pal,b,image)
	if(x.border){if(x.show=='invert'){draw_boxinv(pal,b)}else{draw_box(b,0,1)}}
	if(!target||!in_layer())return
	if(x.draggable){
		const sel=ob.sel.length&&ob.sel[0]==target
		if     (ev.md&&dover(b))msg.target_click  =target,msg.arg_click  =rect(b.x,b.y),ob.sel=[target],ob.prev=rint(rsub(ev.pos,b))
		else if(ev.mu     &&sel)msg.target_release=target,msg.arg_release=rsub(ev.dpos,ob.prev),ob.sel=[]
		else if(ev.drag   &&sel)msg.target_drag   =target,msg.arg_drag   =rsub(ev.dpos,ob.prev)
	}else if(dover(b)){
		const p=rint(rect((ev.pos.x-b.x)/x.scale,(ev.pos.y-b.y)/x.scale)), dp=p.x!=msg.lastdrag.x||p.y!=msg.lastdrag.y, im=over(b)
		if     (ev.md          )msg.target_click  =target,msg.arg_click  =p,msg.lastdrag=p
		else if(ev.mu          )msg.target_release=target,msg.arg_release=p
		else if(ev.drag&&dp&&im)msg.target_drag   =target,msg.arg_drag   =p,msg.lastdrag=p
	}
}

export const grid_exit=_=>{
	wid.ingrid=0,wid.gv=null,wid.gt=null
	if(wid.hist)wid.hist=[],wid.hist_cursor=0
}
export const widget_grid=(target,x,value)=>{
	if(x.show=='none')return 0; const hfnt=FONT_BODY, hsize=x.headers?font_h(hfnt)+5:0, showscroll=x.size.h<=(50+hsize)||x.size.w<16?0:x.scrollbar
	const fnt=x.font?x.font:FONT_MONO, os=value.scroll, or=value.row, oc=value.col, files=x.headers==2, headers=files||x.size.h<=hsize?0:x.headers
	const tk=tab_cols(value.table), nr=count(value.table), nc=tk.length, rh=font_h(fnt)+(x.lines?5:3)
	const fcol=!in_layer()?13:x.show=='invert'?32:1, bcol=x.show=='invert'?1:32, b=x.size, pal=deck.patterns.pal.pix
	let sel=in_layer()&&x.show!='none'&&wid.active==wid.count
	if(in_layer()&&dover(b)&&(ev.md||ev.mu||ev.drag)){if(!sel&&wid.gv)grid_exit(); wid.active=wid.count,sel=1}
	if(sel&&in_layer()&&!over(b)&&ev.md)sel=0,wid.active=-1,grid_exit()
	if(sel){if(wid.fv)field_exit();wid.ingrid=1,wid.g=x,wid.gv=value,wid.gt=target}; if(x.show!='transparent')draw_rect(b,bcol)
	const bh=rect(b.x,b.y,b.w,headers?font_h(hfnt)+5:0), nrd=0|min(nr,((b.h-bh.h+1)/rh)), scrollmax=nr-nrd
	const sbar=scrollbar(rect(b.x,b.y+(headers?bh.h-1:0),b.w,b.h-(headers?bh.h-1:0)),scrollmax,1,nrd,value.scroll,showscroll,x.show=='invert')
	const bb=sbar.size; value.scroll=sbar.scroll, hwt=x.widths.reduce((x,y)=>x+y,0)
	draw_box(x.lines?b:rect(b.x,bb.y,b.w,b.h-(bb.y-b.y)),0,sel?13:fcol)
	const cw=n=>0|(n>=x.widths.length?((bb.w-hwt)/(nc-x.widths.length)):x.widths[n])
	const grid_cell=pos=>{let cx=0;for(let z=0;z<min(nc,pos.x);z++)cx+=cw(z);return rclip(bb,rect(bb.x+cx,bb.y+rh*pos.y+1,pos.x==nc-1?bb.w-cx:cw(pos.x),rh-1))}
	const grid_hcell=pos=>{const r=inset(grid_cell(pos),x.lines?1:0);if(pos.x&&x.lines)r.x+=1,r.w-=1;return r}
	if(x.lines)draw_rect(bh,fcol);if(nc<=0)draw_textc(inset(bb,1),'(no data)',hfnt,fcol)
	const rowb=n=>rect(bb.x,bb.y+rh*n,bb.w,rh)
	const rowh=n=>inset(rect(bb.x+1,bb.y+rh*n+2,bb.w-2,rh-3),x.lines?0:-1)
	let clicked=0,rsel=0,hrow=-1,hcol=-1;for(let y=0;y<nrd;y++){
		const ra=in_layer()&&over(bb)&&over(rowb(y));let cbox=rect()
		if(ra&&x.bycell){for(let z=0;z<nc;z++){const cell=rect(z,y);if(over(grid_cell(cell)))hcol=z,cbox=grid_hcell(cell)}}
		if(ra&&(ev.md||ev.drag)){rsel=1,hrow=y+value.scroll,draw_rect(x.bycell?cbox:rowh(y),fcol)}
		if(ra&&ev.mu)clicked=1,value.row=y+value.scroll,value.col=hcol
		if(ra&&!ev.drag)uicursor=cursor.point
	}const rr=value.row-value.scroll;
	if(!rsel&&rr>=0&&rr<nrd&&(x.bycell?value.col>=0&&value.col<nc:1)){
		hrow=value.row,hcol=value.col
		draw_rect(x.bycell&&value.col>=0?grid_hcell(rect(value.col,rr)): rowh(rr),fcol)
	}
	for(let z=0,cols=0,cx=0;z<nc&&cx+cw(cols)<=bb.w;z++,cols++){
		const hs=rect(bh.x+4+cx,bh.y+1,cw(cols)-5,bh.h-2)
		if(hs.w<=0)continue; // suppressed column
		if(headers){
			const oa=target&&in_layer()&&over(hs)&&((ev.drag||ev.mu)?dover(hs):1)&&!wid.col_drag
			const dp=oa&&(ev.md||ev.drag);if(dp)draw_rect(hs,x.lines?bcol:fcol)
			draw_textc(hs,tk[z],hfnt,x.lines^dp?bcol:fcol); if(oa&&!ev.drag)uicursor=cursor.point
			if(oa&&ev.mu)msg.target_order=target,msg.arg_order=lms(tk[z])
		}
		if(cols&&x.lines)draw_invert(pal,rect(hs.x-3,b.y+1,1,b.h-2));cx+=cw(cols)
		for(let y=0;y<nrd;y++){
			const cell=rect(hs.x-3,bb.y+rh*y+1,hs.w+5,rh-1), v=tab_cell(value.table,tk[z],y+value.scroll)
			const fc=x.format[z]=='L'?'s':(x.format[z]||'s'), ccol=y+value.scroll==hrow&&(x.bycell?cols==hcol :1)?bcol:fcol
			const cf=ls(dyad.format(lms(`%${fc}`),fc=='j'||fc=='a'?monad.list(v):v)), ip=rcenter(cell,ICONS[0].size)
			const oc=frame.clip; frame.clip=rclip(cell,frame.clip)
			if     (x.format[z]=='I'){const i=clamp(0,ln(v),8);if(i<8)draw_icon(ip,ICONS[i],ccol)}
			else if(x.format[z]=='B'){if(lb(v))draw_icon(ip,ICONS[ICON.chek],ccol)}
			else{('fcCihH'.indexOf(x.format[z])>=0?draw_textr:draw_text_fit)(rect(hs.x+1,bb.y+rh*y,hs.w-2,rh),cf,fnt,ccol)} // right-align numeric
			frame.clip=oc
			if(!x.locked&&sel&& ((ev.dclick&&over(cell)) || (ev.action&&x.bycell&&z==value.col&&y+value.scroll==value.row))){
				const f=x.format[z]||'s', tc=rect(z,y+value.scroll)
				if     (f=='I'||f=='L'){} // no editing allowed
				else if(f=='B'||f=='b'){grid_edit_cell(tc,lmn(!lb(v)))} // toggle
				else{
					wid.pending_grid_edit=1,ms.pending_grid_cell=grid_cell(rect(tc.x,tc.y-value.scroll))
					ms.pending_grid_cell.y-=1,ms.pending_grid_cell.w+=1,ms.pending_grid_cell.h+=2
					ms.cell=tc,ms.text=fieldstr(lms(cf))
				}
			}
		}
	}
	if(x.lines)for(let y=1;y<nrd;y++)draw_hline(bb.x,bb.x+bb.w,bb.y+rh*y,fcol)
	if(!x.locked&&in_layer()&&target)for(let z=0,cx=bh.x;z<nc;cx+=cw(z),z++){
		const h=rect(cx+cw(z)-1,bh.y,5,bh.h);if(h.x+h.w>b.x+b.w)break
		if(over(h))draw_vline(h.x+2,h.y,h.y+h.h,13)
		if(ev.md&&dover(h))wid.col_drag=1,wid.col_num=z,wid.col_orig=cw(z)
		if(sel&&wid.col_drag&&wid.col_num==z&&ev.drag){
			const s=min(max(10,wid.col_orig+(ev.pos.x-ev.dpos.x)),bb.w-10),i=z;uicursor=cursor.drag
			iwrite(target,lms('widths'),lml(range(max(x.widths.length,i+1)).map(z=>lmn(i==z?s:cw(z))))),mark_dirty()
		}
	}
	if(target&&os!=value.scroll)iwrite(target,lms('scroll'),lmn(value.scroll)),mark_dirty()
	if(target&&or!=value.row)iwrite(target,lms('row'),lmn(value.row)),mark_dirty()
	if(target&&oc!=value.col)iwrite(target,lms('col'),lmn(value.col)),mark_dirty()
	if(target&&clicked)msg.target_click=target,msg.arg_click=rect(0,value.row)
	if(in_widgets())wid.count++
	return files?((clicked&&ev.dclick)||(sel&&ev.action)): clicked
}
export const grid_format=_=>lms(wid.g.format.length?wid.g.format:'s'.repeat(tab_cols(wid.gv.table).length))
export const grid_apply=v=>{
	wid.gv.table=v,wid.gv.row=-1;if(!wid.gt)return
	iwrite(wid.gt,lms('value'),v),iwrite(wid.gt,lms('row'),lmn(-1)),mark_dirty()
	msg.target_change=wid.gt,msg.arg_change=v
}
export const grid_undo=_=>{const x=wid.hist[--(wid.hist_cursor)];grid_apply(x[0])}
export const grid_redo=_=>{const x=wid.hist[(wid.hist_cursor)++];grid_apply(x[1])}
export const grid_edit=v=>{wid.hist=wid.hist.slice(0,wid.hist_cursor),wid.hist.push([wid.gv.table,v]),grid_redo()}
export const grid_deleterow=_=>grid_edit(dyad.drop(lml([lmn(wid.gv.row)]),wid.gv.table))
export const grid_insertrow=_=>{
	const f=ls(grid_format()), x=wid.gv.table, r=lmt(), s=wid.gv.row+1
	tab_cols(x).map((k,col)=>{
		const o=tab_get(x,k)
		tab_set(r,k,range(o.length+1).map(i=>(i==s)?('sluro'.indexOf(f[col])>=0?lms(''):NONE): o[i-(i>=s?1:0)]))
	});grid_edit(r),iwrite(wid.gt,lms('col'),NONE),iwrite(wid.gt,lms('row'),lmn(s))
	const os=wid.gv.scroll,ns=grid_scrollto(x,wid.g,os,s);if(os!=ns){wid.gv.scroll=ns,iwrite(wid.gt,lms('scroll'),lmn(ns))}
}
export const grid_edit_cell=(cell,v)=>{
	wid.gv.col=cell.x,iwrite(wid.gt,lms('col'),lmn(cell.x))
	wid.gv.row=cell.y,iwrite(wid.gt,lms('row'),lmn(cell.y))
	msg.target_ccell=wid.gt,msg.arg_ccell=lms(ls(v))
}
export const grid_keys=(code,shift)=>{
	const fnt=wid.g.font?wid.g.font:FONT_MONO, hfnt=FONT_BODY, nr=count(wid.gv.table), nc=tab_cols(wid.gv.table).length
	let m=0, r=wid.gv.row, c=wid.gv.col
	const rh=font_h(fnt)+5, bh=wid.g.headers?font_h(hfnt)+5:0, nrd=min(nr,0|((wid.g.size.h-bh+1)/rh))
	if(code=='ArrowUp'   ){m=1;if(r==-1){r=0}else{r-=1}}
	if(code=='ArrowDown' ){m=1;if(r==-1){r=0}else{r+=1}}
	if(code=='ArrowLeft' ){m=1;if(c==-1){c=0}else{c-=1}}
	if(code=='ArrowRight'){m=1;if(c==-1){c=0}else{c+=1}}
	if(code=='PageUp'    ){m=1;if(r==-1)r=0;r-=nrd}
	if(code=='PageDown'  ){m=1;if(r==-1)r=0;r+=nrd}
	if(code=='Home'      ){m=1,r=0}
	if(code=='End'       ){m=1,r=nr-1}
	if(!wid.g.locked&&(code=='Backspace'||code=='Delete'))grid_deleterow()
	if(!m)return;if(ms.type=='prototype_attrs')ms.text.table=ms.name.table=null
	wid.gv.row=r=max(0,min(r,nr-1)),wid.gv.col=c=max(0,min(c,nc-1));if(wid.gt){
		iwrite(wid.gt,lms('row'),lmn(r)),iwrite(wid.gt,lms('col'),lmn(c)),mark_dirty()
		msg.target_click=wid.gt,msg.arg_click=rect(0,r)
	}
	const os=wid.gv.scroll;if(r-os<0)wid.gv.scroll=r;if(r-os>=nrd)wid.gv.scroll=r-(nrd-1)
	if(wid.gt&&os!=wid.gv.scroll)iwrite(wid.gt,lms('scroll'),lmn(wid.gv.scroll)),mark_dirty()
}

export const layout_index=(x,p)=>{
	for(let z=0;z<x.lines.length;z++){
		const l=x.lines[z].pos  ;if(p.y>l.y+l.h)continue
		const r=x.lines[z].range;if(p.y<l.y    )return r.x
		for(let i=r.x;i<=r.y;i++){const g=x.layout[i].pos;if(p.x<g.x+(g.w/2))return i;}
		return z==x.lines.length-1?x.layout.length: r.y
	}return x.layout.length
}
export const layout_last=(x,font)=>x.layout.length>0?last(x.layout): {pos:rect(0,0,1,font_h(font)),line:0,char:'\0',font,arg:NONE}
export const layout_cursor=(x,index,font,f)=>{
	const bw=f.size.w-5-(f.scrollbar?ARROWS[0].size.x+3:0), bx=f.align=='center'?0|(bw/2): f.align==ALIGN.right?bw: 0
	const r=x.layout.length>0?rcopy(x.layout[min(index,x.layout.length-1)].pos):rect(bx,0,1,font_h(font))
	if(index>=x.layout.length){if(layout_last(x,font).char=='\n'){r.x=0,r.y+=r.h}else{r.x+=r.w-1}}
	r.w=1;return r
}
export const field_change=_=>{
	if(!wid.field_dirty||!wid.ft)return
	field_notify_disable=1,iwrite(wid.ft,lms('value'),wid.fv.table),mark_dirty(),field_notify_disable=0
	msg.target_change=wid.ft, msg.arg_change=rtext_string(wid.fv.table)
}
export const field_exit=_=>{field_change(),kc.on=0;wid.infield=0,wid.fv=null,wid.ft=null,wid.cursor=rect(),wid.field_dirty=0,wid.change_timer=0}
export const widget_field=(target,x,value)=>{
	if(x.show=='none')return; if(x.size.h<=50||x.size.w<16)x.scrollbar=0
	const l=!in_layer(), fnt=x.font?x.font: x.style=='code'?FONT_MONO: FONT_BODY, b=x.size, pal=deck.patterns.pal.pix
	const fcol=(l&&!x.locked)?13:x.show=='invert'?32:1, bcol=x.show=='invert'?1:32, os=value.scroll
	if(x.show!='transparent')draw_rect(rclip(b,frame.clip),bcol); if(x.border)draw_box(b,0,fcol)
	let bi=inset(b,2);if(x.scrollbar)bi.w-=ARROWS[0].size.x+3
	if(!l&&!x.locked&&over(bi)&&(ev.drag?dover(bi):1))uicursor=cursor.ibeam
	const layout=layout_richtext(deck,value.table,fnt,x.align,bi.w), last=layout_last(layout,fnt), eol=last.char!='\n'?0: last.pos.h
	const sbar=scrollbar(b,max(0,(last.pos.y+last.pos.h+eol)-bi.h),10,bi.h,value.scroll,x.scrollbar,x.show=='invert');value.scroll=sbar.scroll
	let sel=!x.locked&&!l&&wid.active==wid.count
	// find active link (if any)
	let alink=null;if(x.locked&&!sel&&in_layer()&&x.locked&&(ev.md||ev.drag))for(let z=0;z<layout.layout.length;z++){
		const g=layout.layout[z], pos=rcopy(g.pos);if(pos.w<1)continue // skip squashed spaces/newlines
		pos.y-=value.scroll;if(pos.y+pos.h<0||pos.y>bi.h)continue; pos.x+=bi.x, pos.y+=bi.y // coarse clip
		if(lis(g.arg)&&count(g.arg)&&dover(pos)&&over(pos)){alink=g.arg;break}
	}
	if(!x.locked&&!l&&dover(bi)&&(ev.md||ev.mu||ev.drag)){
		const i=layout_index(layout,rect(ev.pos.x-bi.x,ev.pos.y-bi.y+value.scroll))
		if(ev.md&&!ev.shift){wid.cursor.x=wid.cursor.y=i}else{wid.cursor.y=i}
		if(ev.dclick){ // double-click to select a word or whitespace span:
			let a=0, w=layout.layout.length&&/\s/g.test(layout.layout[min(wid.cursor.y,layout.layout.length-1)].char)
			a=wid.cursor.y;while(a>=0&&a<layout.layout.length&&(w^!/\s/g.test(layout.layout[a].char)))a--;wid.cursor.x=a+1
			a=wid.cursor.y;while(      a<layout.layout.length&&(w^!/\s/g.test(layout.layout[a].char)))a++;wid.cursor.y=a
		}
		const c=layout_cursor(layout,wid.cursor.y,fnt,x);c.y-=value.scroll, ch=min(bi.h,c.h)
		if(c.y<0)value.scroll-=4;if(c.y+ch>bi.h)value.scroll+=clamp(1,(c.y+ch)-bi.h,4) // drag to scroll!
		if(!sel&&wid.fv&&!kc.on)field_exit(); wid.active=wid.count,sel=1
	}
	if(sel&&in_layer()&&!over(b)&&ev.md&&!kc.on)sel=0,wid.active=-1,field_exit()
	if(sel){if(wid.gv)grid_exit();wid.infield=1,wid.f=x,wid.fv=value,wid.ft=target,keycaps_enter()}
	// render
	const bc=rclip(frame.clip,bi); const oc=frame.clip;frame.clip=bc
	for(let z=0;z<layout.layout.length;z++){
		const g=layout.layout[z], pos=rcopy(g.pos);if(pos.w<1)continue // skip squashed spaces/newlines
		pos.y-=value.scroll;if(pos.y+pos.h<0||pos.y>bc.h)continue; pos.x+=bi.x, pos.y+=bi.y // coarse clip
		if(lis(g.arg)&&count(g.arg)){
			draw_hline(pos.x,pos.x+pos.w,pos.y+pos.h-1,alink==g.arg?fcol:19)
			const a=x.locked&&in_layer()&&over(pos)&&target;if(a&&!ev.drag)uicursor=cursor.point
			if(a&&ev.mu&&dover(pos))msg.target_link=target,msg.arg_link=g.arg
		}
		const csel=sel&&wid.cursor.x!=wid.cursor.y&&z>=min(wid.cursor.x,wid.cursor.y)&&z<max(wid.cursor.x,wid.cursor.y)
		if(csel)draw_rect(rclip(pos,frame.clip),fcol)
		if(image_is(g.arg)){image_paste(pos,frame.clip,g.arg,frame.image,x.show!='transparent');if(csel)draw_invert(pal,pos)}
		else{draw_char(pos,g.font,g.char,csel?bcol:fcol)}
	}
	if(sel&&wid.cursor_timer<FIELD_CURSOR_DUTY){
		const c=layout_cursor(layout,wid.cursor.y,fnt,x);c.y-=value.scroll;c.y+=bi.y,c.x+=bi.x
		draw_invert(pal,rclip(c,frame.clip))
	}
	if(target&&os!=value.scroll)iwrite(target,lms('scroll'),lmn(value.scroll)),mark_dirty()
	frame.clip=oc;if(!x.locked&&in_widgets())wid.count++
}
export const field_showcursor=_=>{
	const b=wid.f.size, bi=inset(b,2);if(wid.f.scrollbar)bi.w-=ARROWS[0].size.x+3
	const fnt=wid.f.font?wid.f.font: wid.f.style=='code'?FONT_MONO: FONT_BODY
	const layout=layout_richtext(deck,wid.fv.table,fnt,wid.f.align,bi.w), os=wid.fv.scroll
	const c=layout_cursor(layout,wid.cursor.y,fnt,wid.f), ch=min(bi.h,c.h);c.y-=wid.fv.scroll
	if(c.y<0){wid.fv.scroll+=c.y}if(c.y+ch>=bi.h){wid.fv.scroll+=((c.y+ch)-bi.h)}
	if(wid.ft&&os!=wid.fv.scroll)iwrite(wid.ft,lms('scroll'),lmn(wid.fv.scroll)),mark_dirty()
	return layout
}
export const field_apply=(v,c)=>{
	wid.fv.table=v,wid.cursor=rect(c.x,c.y);if(wid.cursor.x<0)wid.cursor.x=0;if(wid.cursor.y<0)wid.cursor.y=0
	field_showcursor(),wid.field_dirty=1,wid.change_timer=FIELD_CHANGE_DELAY
}
export const field_undo=_=>{const x=wid.hist[--(wid.hist_cursor)];field_apply(x[0],x[1])}
export const field_redo=_=>{const x=wid.hist[(wid.hist_cursor)++];field_apply(x[2],x[3])}
export const field_edit=(font,arg,text,pos)=>{
	const c=rect(), spliced=rtext_splice(wid.fv.table,font,arg,text,pos,c); wid.hist=wid.hist.slice(0,wid.hist_cursor)
	wid.hist.push([wid.fv.table,rect(wid.cursor.x,wid.cursor.y), spliced,c]),field_redo()
}
export const field_editr=(rtext,pos)=>{
	const c=rect(), spliced=rtext_splicer(wid.fv.table,rtext,pos,c); wid.hist=wid.hist.slice(0,wid.hist_cursor)
	wid.hist.push([wid.fv.table,rect(wid.cursor.x,wid.cursor.y), spliced,c]),field_redo()
}
export const field_sel_lines=_=>{
	let a=min(wid.cursor.x,wid.cursor.y),b=max(wid.cursor.x,wid.cursor.y),l=field_showcursor()
	while(a                &&l.layout[a-1].char!='\n')a--
	while(b<l.layout.length&&l.layout[b  ].char!='\n')b++
	return {layout:l,sel:rect(a,b)}
}
export const field_comment=_=>{
	const s=field_sel_lines(), p=s.sel, layout=s.layout.layout; let ac=1,z=p.x;while(z<p.y){
		while(z<p.y&&layout[z].char==' ')z++
		if   (z<p.y&&layout[z].char!='#')ac=0
		while(z<p.y&&layout[z].char!='\n')z++;z++
	}
	let r='';z=p.x;while(z<p.y){
		while(z<p.y&&layout[z].char==' ')r+=' ',z++
		if(ac){if(layout[z].char=='#'){z++;if(z<p.y&&layout[z].char==' ')z++}}else{r+='# '}
		while(z<p.y&&layout[z].char!='\n')r+=layout[z++].char
		if(z<p.y&&layout[z].char=='\n')r+='\n',z++
	}field_edit(lms(''),lms(''),r,p),wid.cursor=rect(p.x,wid.cursor.y)
}
export const field_indent=add=>{
	const s=field_sel_lines(), p=s.sel, layout=s.layout.layout; let r='',z=p.x;while(z<p.y){
		if(add){r+=' '}else{if(layout[z].char==' ')z++}
		while(z<p.y&&layout[z].char==' ')r+=' ',z++
		while(z<p.y&&layout[z].char!='\n')r+=layout[z++].char
		if(z<p.y&&layout[z].char=='\n')r+='\n',z++
	}field_edit(lms(''),lms(''),r,p);wid.cursor=rect(p.x,wid.cursor.y)
}
export const field_stylespan=(font,arg)=>field_edit(font,arg,ls(rtext_string(wid.fv.table,wid.cursor)),wid.cursor)
export const field_input=text=>{
	if(text=='\n'){if(ms.type=='save')ev.action=1;if(ms.type=='save'||ev.shift)return}
	const rtext_font=(table,x)=>{const i=rtext_get(table,x);return i<0?lms(''):tab_cell(table,'font',i)}
	field_edit(rtext_font(wid.fv.table,wid.cursor.y),lms(''),clchars(text),wid.cursor)
}
export const field_keys=(code,shift)=>{
	if(code=='Enter'&&ms.type=='gridcell'){modal_exit(1),ev.action=0;return}
	const b=wid.f.size, bi=inset(b,2);if(wid.f.scrollbar)bi.w-=ARROWS[0].size.x+3
	const fnt=wid.f.font?wid.f.font: wid.f.style=='code'?FONT_MONO: FONT_BODY, layout=layout_richtext(deck,wid.fv.table,fnt,wid.f.align,bi.w)
	let m=0, s=wid.cursor.x!=wid.cursor.y
	const l=wid.cursor.y>=layout.layout.length?layout.lines.length-1:layout.layout[wid.cursor.y].line, c=layout_cursor(layout,wid.cursor.y,fnt,wid.f)
	if(code=='ArrowLeft'   ){m=1;if(s&&!shift){wid.cursor.x=wid.cursor.y=min(wid.cursor.x,wid.cursor.y)}else{wid.cursor.y--}}
	if(code=='ArrowRight'  ){m=1;if(s&&!shift){wid.cursor.x=wid.cursor.y=max(wid.cursor.x,wid.cursor.y)}else{wid.cursor.y++}}
	if(code=='ArrowUp'     ){m=1;if(l>=0)wid.cursor.y=layout_index(layout,rect(c.x-1,layout.lines[l].pos.y                      -1   ))}
	if(code=='ArrowDown'   ){m=1;if(l>=0)wid.cursor.y=layout_index(layout,rect(c.x-1,layout.lines[l].pos.y+layout.lines[l].pos.h+1   ))}
	if(code=='PageUp'      ){m=1;if(l>=0)wid.cursor.y=layout_index(layout,rect(c.x-1,layout.lines[l].pos.y                      -bi.h))}
	if(code=='PageDown'    ){m=1;if(l>=0)wid.cursor.y=layout_index(layout,rect(c.x-1,layout.lines[l].pos.y+layout.lines[l].pos.h+bi.h))}
	if(code=='Home'        ){m=1;if(ev.alt){wid.cursor.y=0                   }else if(l>=0)wid.cursor.y=layout.lines[l].range.x;}
	if(code=='End'         ){m=1;if(ev.alt){wid.cursor.y=layout.layout.length}else if(l>=0)wid.cursor.y=layout.lines[l].range.y+(l==layout.lines.length-1?1:0);}
	if(code=='Backspace'   ){field_edit(lms(''),lms(''),'',s?wid.cursor:rect(wid.cursor.y-1,wid.cursor.y))}
	if(code=='Delete'      ){field_edit(lms(''),lms(''),'',s?wid.cursor:rect(wid.cursor.y,wid.cursor.y+1))}
	if(code=='Enter'       ){
		if(shift&&wid.ft){field_change(),msg.target_run=wid.ft,msg.arg_run=rtext_string(wid.fv.table,s?wid.cursor:rect(0,RTEXT_END))}
		else{
			let i=0;if(wid.f.style=='code'){
				const sl=field_sel_lines(),s=sl.sel,layout=sl.layout.layout
				while(s.x<layout.length&&layout[s.x].char==' ')i++,s.x++
			}field_input('\n'+' '.repeat(i))
		}
	}
	if(code=='Tab'&&wid.f.style=='code'){if(!shift&&!s){field_input(' ')}else{field_indent(!shift)}}
	const nl=layout_richtext(deck,wid.fv.table,fnt,wid.f.align,bi.w)
	wid.cursor.y=clamp(0,wid.cursor.y,nl.layout.length); if(!m)return
	wid.cursor_timer=0; if(!shift)wid.cursor.x=wid.cursor.y; field_showcursor()
}
export const widget_contraption=x=>{
	const show=ls(ifield(x,'show'));if(show=='none')return
	const b=rpair(getpair(ifield(x,'pos')),getpair(ifield(x,'size'))), image=ifield(x,'image')
	const oc=frame.clip,pal=deck.patterns.pal.pix;frame.clip=rclip(frame.clip,b)
	draw_9seg(b,frame.image,image,getrect(ifield(x.def,'margin')),frame.clip,show=='solid',show=='invert'?pal:null)
	handle_widgets(x.widgets,rect(b.x,b.y)),frame.clip=oc
}

let attrs=[], attrs_scroll=0
export const widget_attributes=b=>{
	const attr_heights={bool:16,number:20,string:20,code:80,rich:80}
	draw_box(b,0,1)
	let h=5,lw=0;attrs.map(a=>{h+=attr_heights[a.type]+5;if(a.type!='bool')lw=max(lw,font_textsize(FONT_MENU,a.label).x)})
	const sbar=scrollbar(b,max(0,h-b.h),10,b.h,attrs_scroll,1,0), bi=sbar.size;attrs_scroll=sbar.scroll,bi.y+=1
	const oc=frame.clip;frame.clip=bi,lw=0|min(lw+10,bi.w*.6)
	const bp=ev.pos,bd=ev.dpos,bs=ev.scroll;ev.scroll=0;if(!over(bi))ev.pos=rect(-1,-1);if(!dover(bi))ev.dpos=rect(-1,-1)
	let y=5;attrs.map(a=>{
		const lb=rect(bi.x+5,bi.y+y-attrs_scroll,lw,attr_heights[a.type]), wb=rect(lb.x+lb.w+5,lb.y,(bi.w-15)-lb.w,lb.h);y+=lb.h+5
		if(a.type=='bool'){lb.w=bi.w-10;if(ui_checkbox(lb,a.label,1,a.bval))a.bval^=1;return}else{draw_text_fit(lb,a.label,FONT_MENU,1)}
		if(a.type=='number')ui_field(wb,a.value)
		if(a.type=='string')ui_field(wb,a.value)
		if(a.type=='code'  )ui_codeedit(wb,1,a.value)
		if(a.type=='rich'  )ui_richedit(wb,1,a.value)
	});frame.clip=oc,ev.pos=bp,ev.dpos=bd,ev.scroll=bs
}
export const handle_widgets=(x,offset)=>{
	x.v.map(w=>{
		if(button_is(w)){
			const v=lb(ifield(w,'value')), p=unpack_button(w);p.size=radd(p.size,offset)
			if(widget_button(w,p,v)&&p.style=='check')iwrite(w,lms('value'),lmn(!v)),mark_dirty()
		}
		if(slider_is(w)){const p=unpack_slider(w);p.size=radd(p.size,offset);widget_slider(w,p)}
		if(canvas_is(w)){const p=unpack_canvas(w);p.size=radd(p.size,offset);widget_canvas(w,p,container_image(w,0))}
		if(grid_is  (w)){const p=unpack_grid(w),v=unpack_grid_value(w);p.size=radd(p.size,offset);widget_grid(w,p,v);if(wid.gt==w)wid.gv=v}
		if(field_is(w)){
			if(wid.ft==w){widget_field(w,wid.f,wid.fv)}
			else{const p=unpack_field(w),v=unpack_field_value(w);p.size=radd(p.size,offset);widget_field(w,p,v);if(wid.ft==w)wid.fv=v}
		}
		if(contraption_is(w))widget_contraption(w)
	})
}

export const ui_button  =(r,label,    enable,func )=>widget_button(null,{text:label,size:r,font:FONT_MENU,style:'round',show:             'solid',locked:!enable},0,func)
export const ui_toggle  =(r,label,inv,enable,func )=>widget_button(null,{text:label,size:r,font:FONT_MENU,style:'round',show:inv?'invert':'solid',locked:!enable},0,func)
export const ui_radio   =(r,label,    enable,value)=>widget_button(null,{text:label,size:r,font:FONT_BODY,style:'radio',show:             'solid',locked:!enable},value)
export const ui_checkbox=(r,label,    enable,value)=>widget_button(null,{text:label,size:r,font:FONT_BODY,style:'check',show:             'solid',locked:!enable},value)
export const ui_field   =(r,       value)=>widget_field(null,{size:r,font:FONT_BODY,show:'solid',scrollbar:0,border:1,style:'plain',align:ALIGN.left,locked:0},value)
export const ui_dfield  =(r,enable,value)=>widget_field(null,{size:r,font:FONT_BODY,show:'solid',scrollbar:0,border:1,style:'plain',align:ALIGN.left,locked:!enable},value)
export const ui_textedit=(r,border,value)=>widget_field(null,{size:r,font:FONT_BODY,show:'solid',scrollbar:1,border  ,style:'plain',align:ALIGN.left,locked:0},value)
export const ui_codeedit=(r,border,value)=>widget_field(null,{size:r,font:FONT_MONO,show:'transparent',scrollbar:1,border  ,style:'code' ,align:ALIGN.left,locked:running()},value)
export const ui_richedit=(r,border,value)=>widget_field(null,{size:r,font:FONT_BODY,show:'solid',scrollbar:1,border  ,style:'rich' ,align:ALIGN.left,locked:0},value)
export const ui_table   =(r,widths,format,value)=>widget_grid(null,{size:r,font:FONT_BODY,widths   ,format   ,headers:2,scrollbar:1,lines:0,bycell:0,show:'solid',locked:1},value)
export const ui_list    =(r,              value)=>widget_grid(null,{size:r,font:FONT_BODY,widths:[],format:'',headers:0,scrollbar:1,lines:0,bycell:0,show:'solid',locked:1},value)

// The Listener

export const listen_show_image=(x,v)=>{
	frame=context;while(li.hist.length>=LISTEN_LINES)li.hist.shift()
	li.hist.push([x,v]),li.scroll=RTEXT_END
}
export const listen_show=(align,bare,x)=>listen_show_image(draw_lil(rsub(LISTEN_SIZE(),rect(18,5)),align,bare,x),x)
export const n_show=(a)=>{a[0]=a[0]||NONE;if(a.length<2){listen_show(ALIGN.right,0,a[0])}else{listen_show(ALIGN.right,1,lms(a.map(show).join(' ')))};return a[0]}
export const n_print=(a)=>{a[0]=a[0]||NONE;if(a.length<2){listen_show(ALIGN.right,1,lms(ls(a[0])))}else{listen_show(ALIGN.right,1,a[0]=dyad.format(a[0],lml(a.slice(1))))}return a[0]}
export const n_pre_listen=([a])=>{
	const ev=getev();
	for(let name of li.vars.keys()){if(!ev.v.get(name))ev.v.set(name,li.vars.get(name))}
	if(ob.sel.length&&uimode=='object')ev.v.set('selected',lml(ob.sel.slice(0)))
	return a
}
export const n_post_listen=([a])=>{
	const ev=getev();for(let name of ev.v.keys())li.vars.set(name,ev.v.get(name))
	li.vars.set('_',a),listen_show(ALIGN.right,0,a);return a
}
export const n_post_query=([a])=>{ms.grid=gridtab(lt(a));return a}
export const listener_eval=_=>{
	const str=rtext_string(ms.text.table);if(count(str)<1)return
	try{
		const prog=parse(ls(str)), b=lmblk(); ms.text=fieldstr(lms('')),listen_show(ALIGN.left,1,str)
		const target=uimode=='script'?sc.target: ob.sel.length==1?ob.sel[0]: con()
		blk_opa(b,op.BUND,1),blk_lit(b,lmnat(n_pre_listen )),blk_lit(b,NONE   ),blk_op(b,op.CALL),blk_op(b,op.DROP),blk_cat(b,prog)
		blk_opa(b,op.BUND,1),blk_lit(b,lmnat(n_post_listen)),blk_op (b,op.SWAP),blk_op(b,op.CALL),blk_op(b,op.DROP),fire_hunk_async(target,b)
	}catch(e){listen_show(ALIGN.right,1,lms(`error: ${e.x}`));return}
}
export const listener=r=>{
	const size=LISTEN_SIZE(), th=li.hist.reduce((x,y)=>x+y[0].size.y+5,0), h=min(th,size.y)
	const esize=rect(0|(r.x+(r.w-size.x)/2),r.y+r.h-49,size.x,50), tsize=rect(esize.x,esize.y-(h?h+5:0),esize.w,h)
	const bsize=rect(esize.x-5,esize.y-5-(h?tsize.h+5:0),esize.w+10,(h?tsize.h+5:0)+esize.h+20), pal=deck.patterns.pal.pix
	draw_shadow(bsize,1,32,1),ui_codeedit(esize,1,ms.text)
	if(h){
		const sbar=scrollbar(tsize,max(0,th-size.y),10,tsize.h,li.scroll,h>=size.y,0), b=sbar.size; li.scroll=sbar.scroll
		let cy=0;li.hist.map(x=>{
			const l=x[0], t=x[1], s=l.size; let lb=rect(b.x,b.y+cy-li.scroll,s.x,s.y)
			image_paste(lb,b,l,frame.image,0),cy+=s.y+5
			lb=rclip(b,lb);const v=over(lb), a=v&&dover(lb)
			if(v)uicursor=cursor.point,draw_box(inset(lb,-1),0,13); if(a&&(ev.md||ev.drag))draw_invert(pal,lb)
			if(a&&ev.mu)ms.text=fieldstr(image_is(t)?lms(`image["${ls(ifield(t,'encoded'))}"]`): !lis(t)?lms(show(t)): t)
		})
	}
}
export const n_panic=z=>{
	do_panic=1,halt(),states.map(x=>x.t=[]),modal_enter('listen')
	const s=rect((512-22)-18,16),b=rpair(rect(0,0),s),r=image_make(s),t=frame;frame=draw_frame(r)
	draw_box(b,0,35),draw_textc(inset(b,2),'PANIC',FONT_MONO,35),frame=t,listen_show_image(r,NONE)
	n_show(z),li.vars.set('_',z[0]||NONE);return NONE
}

// Audio

let audio=null, samples_playing=0, audio_loop=null, audio_loop_playing=null
const audioContext=window.AudioContext||window.webkitAudioContext, offline=window.OfflineAudioContext||window.webkitOfflineAudioContext
export const initaudio=_=>{if(!audio)audio=new audioContext({sampleRate:44100})}
export const load_sound=(file,after)=>{
	decode_sound=data=>{
		const r=[];for(let z=0;z<data.length&&r.length<10*SFX_RATE;z+=8)r.push(sample_to_byte(data[z]));
		if(after){after(sound_make(Uint8Array.from(r)));return;}
		au.target=deck_add(deck,sound_read(ln(0))),mark_dirty()
		sound_edit(sound_make(Uint8Array.from(r))),au.sel=rect(),au.head=0,modal_enter('recording')
	}
	import_sound=buffer=>{
		initaudio(),audio.decodeAudioData(buffer,payload=>{
			const conv=new offline(1,payload.length*64000/payload.sampleRate,64000),buff=conv.createBufferSource()
			conv.oncomplete=e=>{decode_sound(e.renderedBuffer.getChannelData(0))}
			buff.buffer=payload,buff.connect(conv.destination),buff.start(0),conv.startRendering()
		})
	}
	const r=new FileReader();r.onload=_=>import_sound(r.result),r.readAsArrayBuffer(file)
}
export const sfx_stoploop=_=>{audio_loop_playing.onended=null,audio_loop_playing.stop(),audio_loop=audio_loop_playing=null}
export const sfx_doloop=clear=>{
	const a=audio_loop||NONE,b=lmblk(),pp=pending_popstate;let r=NONE, quota=LOOP_QUOTA
	blk_get(b,lms('loop')),blk_lit(b,lml([a])),blk_op(b,op.CALL)
	fire_hunk_async(ifield(deck,'card'),b)
	while(quota>0&&running()){runop(),quota--}
	if(!running())r=arg();popstate(),pending_popstate=pp
	if(clear&&audio_loop)sfx_stoploop()
	n_play([r,lms('loop')]),msg.pending_loop=0
}
export const n_play=([x,hint])=>{
	const prepare=sfx=>{
		const playback=audio.createBuffer(1,sfx.data.length*8,64000),dest=playback.getChannelData(0)
		for(let z=0;z<sfx.data.length;z++)for(let b=0;b<8;b++)dest[z*8+b]=MASTER_VOLUME*byte_to_sample(sfx.data[z])
		const playing=audio.createBufferSource();playing.buffer=playback,playing.connect(audio.destination);return playing
	}
	if(hint&&ls(hint)=='loop'&&audio){
		if(lis(x))x=dget(ifield(deck,"sounds"),x)
		if(x&&audio_loop==x){} // don't re-trigger
		else if(sound_is(x)&&ln(ifield(x,'size'))>0){
			if(audio_loop)sfx_stoploop()
			audio_loop=x,audio_loop_playing=prepare(x)
			audio_loop_playing.onended=_=>{sfx_doloop(1)}
			audio_loop_playing.start()
		}
		else if(audio_loop){sfx_stoploop()}
		return NONE
	}
	const sfx=!x?x: sound_is(x)?x: dget(deck.sounds,lms(ls(x)));if(!sfx||ln(ifield(sfx,'size'))<1)return NONE;initaudio();if(!audio)return
	const playing=prepare(sfx);playing.addEventListener('ended',_=>{samples_playing--,audio_playing=samples_playing>0})
	playing.start(),samples_playing++,audio_playing=1;return NONE
}
export const stop_sound_pump=_=>{
	if(au.clip)au.clip.stop();au.clip=null,clearInterval(au.tick),au.mode='stopped'
	au.head=au.sel.x==au.sel.y?0:au.sel.x
}
export const play_sound_pump=sfx=>{
	initaudio();if(sfx.data.length<1)return
	const playback=audio.createBuffer(1,sfx.data.length*8,64000),dest=playback.getChannelData(0)
	for(let z=0;z<sfx.data.length;z++)for(let b=0;b<8;b++)dest[z*8+b]=MASTER_VOLUME*byte_to_sample(sfx.data[z])
	const playing=audio.createBufferSource();playing.buffer=playback,playing.connect(audio.destination)
	playing.addEventListener('ended',_=>stop_sound_pump),au.clip=playing;let counter=0
	au.tick=setInterval(_=>{const d=0|(8000*0.05);au.head+=d,counter+=d;if(au.mode!='playing'||counter>=sfx.data.length)stop_sound_pump()},50)
	au.mode='playing',playing.start()
}
export const sfx_any=_=>samples_playing>0

export const sound_slice=range=>{const r=[];for(let z=range.x;z<range.y;z++)r.push(au.target.data[z]);return sound_make(Uint8Array.from(r))}
export const sound_selected=_=>sound_slice(au.sel.x==au.sel.y?rect(0,au.target.data.length):au.sel)
export const sound_apply=v=>{au.target.data=Uint8Array.from(v.data),mark_dirty()}
export const sound_undo=_=>{const x=au.hist[--(au.hist_cursor)];sound_apply(x[0])}
export const sound_redo=_=>{const x=au.hist[(au.hist_cursor)++];sound_apply(x[1])}
export const sound_edit=v=>{au.hist=au.hist.slice(0,au.hist_cursor),au.hist.push([sound_slice(rect(0,au.target.data.length)),v]),sound_redo()}
export const sound_delete=_=>{
	const len=au.target.data.length, sel=au.sel.x==au.sel.y?rect(0,len):rcopy(au.sel), r=[]
	for(let z=0;z<    sel.x;z++)r.push(au.target.data[z      ])
	for(let z=0;z<len-sel.y;z++)r.push(au.target.data[z+sel.y])
	sound_edit(sound_make(Uint8Array.from(r))),au.head=au.sel.y=au.sel.x
}
export const sound_replace=s=>{
	r=[]
	for(let z=0       ;z<au.sel.x                                     ;z++)r.push(au.target.data[z])
	for(let z=0       ;z<s        .data.length&&r.length<(10*SFX_RATE);z++)r.push(s        .data[z]);const a=r.length
	for(let z=au.sel.y;z<au.target.data.length&&r.length<(10*SFX_RATE);z++)r.push(au.target.data[z])
	au.sel.y=a,au.head=r.length;return sound_make(Uint8Array.from(r))
}
export const sound_finish=_=>{
	au.head=(au.sel.x!=au.sel.y)?au.sel.x:0
	sound_undo(),sound_redo(),au.mode='stopped'
}
export const sound_begin_record=_=>{
	stop_sound_pump(),sound_edit(sound_slice(rect(0,au.target.data.length)))
	if(au.sel.x!=au.sel.y)au.head=au.sel.x;au.mode='recording'
}
export const sound_record=_=>{
	initaudio();if(au.record_stream){sound_begin_record();return}
	function resample(input,after){
		// Safari refuses to downsample to or play low sample rates,
		// so convert to 64khz as an even multiple of 8khz
		// and discretize from that. messy, but better than nothing:
		const conv=new offline(1,input.length*64000/input.sampleRate,64000), buff=conv.createBufferSource()
		conv.oncomplete=event=>{after(event.renderedBuffer.getChannelData(0))}
		buff.buffer=input,buff.connect(conv.destination),buff.start(0),conv.startRendering()
	}
	navigator.mediaDevices.getUserMedia({audio:true}).then(stream=>{
		try{
			const source=audio.createMediaStreamSource(stream)
			const scriptNode=audio.createScriptProcessor(4096,1,1)
			scriptNode.onaudioprocess=event=>{
				if(au.mode!='recording')return
				resample(event.inputBuffer,data=>{
					const r=[];for(let z=0;z<data.length;z+=8)r.push(sample_to_byte(data[z]))
					let h=au.head, end=(au.sel.x!=au.sel.y)?au.sel.y:(10*SFX_RATE), edit=au.hist[au.hist_cursor-1][1]
					const appended=min(max(au.target.data.length,h+r.length),end)
					if(appended>au.target.data.length){
						const a=new Uint8Array(appended), b=new Uint8Array(appended)
						for(let z=0;z<appended;z++)a[z]=b[z]=au.target.data[z]
						au.target.data=a,edit.data=b
					}
					for(let z=0;z<r.length&&h<end;z++){au.target.data[h]=edit.data[h]=r[z],h++}
					au.head=h;if(h>=end){sound_finish()}
				})
			}
			source.connect(scriptNode),scriptNode.connect(audio.destination)
			au.record_stream=stream,sound_begin_record()
		}catch(err){console.log(err),au.norecord=1}
	}).catch(err=>{console.log(err),au.norecord=1})
}

// Modal Helpers

export const table_decode=(text,format)=>ms.edit_json?monad.table(dyad.parse(lms('%j'),text)): n_readcsv(count(format)?[text,format]:[text])
export const transit_enumerate=_=>monad.table(monad.keys(deck.transit))
export const sounds_enumerate=_=>{
	const r=lmt(),iv=[],nv=[],bv=[],sv=[];tab_set(r,'icon',iv),tab_set(r,'name',nv),tab_set(r,'bytes',bv),tab_set(r,'secs',sv)
	deck.sounds.v.map((sn,i)=>{
		iv.push(lmn(ICON.sound)),nv.push(deck.sounds.k[i])
		bv.push(dyad.format(lms('%.2fkb'),lmn(ln(ifield(sn,'size'))/1000.0*1.33)))
		sv.push(dyad.format(lms('%.2fs' ),ifield(sn,'duration')))
	});return r
}
export const fonts_enumerate=_=>{ // note that this ALSO finds the selected font, if any!
	const r=lmt(),iv=[],nv=[];tab_set(r,'icon',iv),tab_set(r,'name',nv);let fi=-1
	deck.fonts.v.map((font,z)=>{
		if(uimode=='object'){if(ob.sel.every(x=>ifield(x,'font')==font))fi=z}
		else if(ms.old_wid.ft){if(ifield(ms.old_wid.ft,'font')==font)fi=z}
		iv.push(lmn(ICON.font)),nv.push(deck.fonts.k[z])
	});return gridtab(r,fi)
}
export const contraptions_enumerate=_=>{
	const r=lmt(),iv=[],nv=[];tab_set(r,'icon',iv),tab_set(r,'name',nv)
	deck.contraptions.k.map(k=>{iv.push(lmn(ICON.app)),nv.push(k)});return r
}
export const res_enumerate=(source)=>{
	const r=lmt(),iv=[],nv=[],vv=[];tab_set(r,'icon',iv),tab_set(r,'name',nv),tab_set(r,'value',vv)
	const pat=source.patterns,pp=patterns_write(pat),pa=anims_write(pat),da=dyad.parse(lms('%j'),lms(DEFAULT_ANIMS))
	if(!match(pa,da)||pp!=DEFAULT_PATTERNS)iv.push(lmn(ICON.pat)),nv.push(lms('patterns')),vv.push(pat)
	const fonts=dyad.drop(lms('mono'),dyad.drop(lms('menu'),dyad.drop(lms('#decker_root'),source.fonts)))
	fonts.v.map((font,i)=>{iv.push(lmn(ICON.font)),nv.push(fonts.k[i]),vv.push(font)})
	const sounds=source.sounds
	sounds.v.map((sound,i)=>{iv.push(lmn(ICON.sound)),nv.push(sounds.k[i]),vv.push(sound)})
	const modules=source.modules
	modules.v.map((mod,i)=>{iv.push(lmn(ICON.lil)),nv.push(modules.k[i]),vv.push(mod)})
	const defs=source.contraptions
	defs.v.map((def,i)=>{iv.push(lmn(ICON.app)),nv.push(defs.k[i]),vv.push(def)})
	return r
}
export const title_caps=x=>{let w=1;return x.split('').map(c=>{if(w)c=c.toUpperCase();w=c==' '||c=='\n';return c}).join('')}
export const do_transition=(tween,dest,errors)=>{
	let f=frame;ms.canvas.image.size=dest.size,ms.canvas.image.pix=dest.pix,ms.canvas.image.pix.fill(0),canvas_clip(ms.canvas)
	const a=lml([ms.canvas,ms.carda,ms.cardb,lmn(tween)]), p=lmblk();blk_lit(p,ms.trans),blk_lit(p,a),blk_op(p,op.CALL)
	const e=lmenv();pushstate(e),issue(e,p);let quota=TRANS_QUOTA;while(quota&&running())runop(),quota--
	if(running()&&errors){listen_show(ALIGN.right,1,lms(`warning: transition ${ms.trans.n} exceeded quota and was halted.`)),tween=2}
	popstate(),frame=f,sleep_play=0,sleep_frames=0;return tween
}

// Modal Dialogues

export const modal_enter=type=>{
	ev.md=ev.mu=ev.dclick=0,menus_clear()
	if(ms.type=='trans')return
	ms.from_listener=ms.type=='listen'
	ms.from_keycaps=kc.on
	ms.type=ms.subtype=type
	ms.old_wid=wid,wid=wid_state()
	if(enable_touch){wid.active=({link:1,gridcell:1,listen:1})[type]?0:-1}
	if(type=='listen'){
		if(uimode=='script'){
			try{const text=ls(rtext_string(sc.f.table));parse(text),script_save(text)}
			catch(e){listen_show(ALIGN.right,1,lms('note: this script contains an error.\nexecuting under last saved version!'))}
		}
		ms.text=fieldstr(lms('')),li.scroll=RTEXT_END
	}
	if(type=='query')ms.grid=gridtab(ms.old_wid.gv.table),ms.text=fieldstr(lms('select from me.value'))
	if(type=='recording'){
		au.head=0,au.sel=rect(),au.mode='stopped',au.hist=[],au.hist_cursor=0
		ms.name=fieldstr(dkey(deck.sounds,au.target)||lms('unknown sound'))
	}
	if(type=='cards')ms.grid=gridtab(null)
	if(type=='orderwids')ms.grid=gridtab(null),ms.grid.col=-99
	if(type=='sounds')ms.grid=gridtab(sounds_enumerate())
	if(type=='contraptions'||type=='pick_contraption')ms.grid=gridtab(contraptions_enumerate())
	if(type=='fonts')ms.grid=fonts_enumerate(),ms.grid.scroll=-99
	if(type=='resources')ms.message=null,ms.grid=gridtab(lmt()),ms.grid2=gridtab(res_enumerate(deck))
	if(type=='link'){
		const t=ms.old_wid.fv.table,ol=tab_cell(t,'arg',rtext_get(t,ms.old_wid.cursor.y))
		ms.text=fieldstr(ol);if(count(ol))ms.old_wid.cursor=rtext_getr(t,ms.old_wid.cursor.y)
	}
	if(type=='grid'        )ms.name=fieldstr(lmn(dr.grid_size.x     )),ms.text=fieldstr(lmn(dr.grid_size.y       ))
	if(type=='deck_props'  )ms.name=fieldstr(ifield(deck     ,'name')),ms.text=fieldstr(ifield(deck     ,'author'))
	if(type=='button_props')ms.name=fieldstr(ifield(ob.sel[0],'name')),ms.text=fieldstr(ifield(ob.sel[0],'text'  )),ms.form0=fieldstr(ifield(ob.sel[0],'shortcut'))
	if(type=='field_props' )ms.name=fieldstr(ifield(ob.sel[0],'name')),ms.text=fieldstr(ifield(ob.sel[0],'value' ))
	if(type=='grid_props'  )ms.name=fieldstr(ifield(ob.sel[0],'name')),ms.text=fieldstr(ifield(ob.sel[0],'format'))
	if(type=='grid_props'  )ms.form0=fieldstr(lms(fjson(monad.cols(ifield(ob.sel[0],'value'))))),ms.edit_json=1
	if(type=='canvas_props')ms.name=fieldstr(ifield(ob.sel[0],'name')),ms.text=fieldstr(ifield(ob.sel[0],'scale' ))
	if(type=='slider_props'){
		ms.name =fieldstr(   ifield(ob.sel[0],'name'    )    )
		ms.text =fieldstr(   ifield(ob.sel[0],'format'  )    )
		ms.form0=fieldstr(ll(ifield(ob.sel[0],'interval'))[0])
		ms.form1=fieldstr(ll(ifield(ob.sel[0],'interval'))[1])
		ms.form2=fieldstr(   ifield(ob.sel[0],'step'    )    )
	}
	if(type=='contraption_props'){
		const w=ob.sel[0],a=ifield(w.def,'attributes');ms.name=fieldstr(ifield(w,'name'))
		attrs=[],attrs_scroll=0;tab_get(a,'name').map((n,i)=>{
			const v=iwrite(w,n), item={type:ls(tab_cell(a,'type',i)), label:ls(tab_cell(a,'label',i)), bval:0, value:fieldstr('')}
			if     (item.type=='bool'){item.bval=lb(v)}
			else if(item.type=='rich'){item.value.table=rtext_cast(v)}
			else {item.value.table=rtext_cast(v)}
			attrs.push(item)
		})
	}
	if(type=='prototype_props'){
		const c=con()
		ms.name =fieldstr(ifield(c,'name'))
		ms.form0=fieldstr(ifield(c,'description'))
		ms.form1=fieldstr(ifield(c,'template'))
		ms.form2=fieldstr(ifield(c,'version'))
	}
	if(type=='prototype_attrs'){
		const a=ifield(con(),'attributes')
		ms.grid=gridtab(dyad.take(lmn(count(a)),a))
		ms.name=fieldstr(lms(''))
		ms.text=fieldstr(lms(''))
	}
	if(type=='pick_card')ms.act_card=ln(ifield(ifield(deck,'card'),'index')),ms.carda=ob.sel.slice(0)
	if(type=='action'){
		sc.target=ob.sel[0],sc.others=[]
		ms.act_go=1,ms.act_gomode=5,ms.act_trans=0,ms.act_sound=0
		ms.verb   =lms('') // card name
		ms.message=lms('') // sound name
		ms.grid=gridtab(transit_enumerate(),0)
		ms.canvas=free_canvas(deck),ms.canvas.size=rect(17,13)
		ms.carda=image_read('%%IMG0ABEADQAAAAAAAACAAAFAAAIgAAIgAAQQAAfwAAgIAAgIAAgIAAAAAAAAAA==')
		ms.cardb=image_read('%%IMG0ABEADf//gP//gPA/gPffgPffgPAPgPf3gPf3gPf3gPf3gPAPgP//gP//gA==')
		// parse action script, if any:
		const scr=ifield(sc.target,'script')
		const p0=dyad.parse(lms('on click do\n  play[%q]\nend%m'             ),scr) // sound, no go
		const p1=dyad.parse(lms('on click do\n  play[%q]\n  go[%q %q]\nend%m'),scr) // sound, go + trans
		const p2=dyad.parse(lms('on click do\n  play[%q]\n  go[%q]\nend%m'   ),scr) // sound, just go
		const p3=dyad.parse(lms('on click do\n  go[%q %q]\nend%m'            ),scr) // no sound, go, trans
		const p4=dyad.parse(lms('on click do\n  go[%q]\nend%m'               ),scr) // no sound, just go
		const fs=lb(monad.last(p0))||lb(monad.last(p1))||lb(monad.last(p2))?ls(monad.first(p0)): null
		const fg=lb(monad.last(p1))||lb(monad.last(p2))?ls(p1.v[1]): lb(monad.last(p3))||lb(monad.last(p4))?ls(monad.first(p3)): null
		const ft=lb(monad.last(p1))?ls(p1.v[2]): lb(monad.last(p3))?ls(p3.v[1]): null
		const fk={First:0,Prev:1,Next:2,Last:3,Back:4}
		if(fs!=null||fg!=null||ft!=null){
			if(fs!=null){ms.act_sound=1,ms.message=lms(fs)}
			if(ft!=null){ms.grid.scroll=-99;tab_get(ms.grid.table,'value').map((x,i)=>{if(ft==ls(x))ms.act_trans=1,ms.grid.row=i})}
			ms.act_go=fg!=null;if(fg!=null){if(fk[fg]!=undefined)ms.act_gomode=fk[fg];if(ms.act_gomode==5)ms.verb=lms(fg)}
		}
	}
	const dname=(x,e)=>{x=x||'untitled';return lms(/\.(deck|html)$/.test(x)?x:x+e)}
	if(type=='card_props')ms.name=fieldstr(ifield(ifield(deck,'card'),'name'))
	if(type=='link'||type=='gridcell'||type=='query')wid.cursor=rect(0,RTEXT_END)
	if(type=='alert_lil'     )ms.type=type='alert'
	if(type=='confirm_lil'   )ms.type=type='confirm'
	if(type=='input_lil'     )ms.type=type='input'
	if(type=='confirm_new'   )ms.type=type='confirm'
	if(type=='confirm_script')ms.type=type='confirm'
	if(type=='multiscript'   )ms.type=type='confirm'
	if(type=='save_deck'     )ms.type=type='save',ms.text=fieldstr(dname(deck.name,'.deck')),ms.desc='Save a .deck or .html file.'
	if(type=='save_locked'   )ms.type=type='save',ms.text=fieldstr(dname(deck.name,'.html')),ms.desc='Save locked standalone deck as an .html file.'
	if(type=='export_script' )ms.type=type='save',ms.text=fieldstr(lms('script.lil'  )),ms.desc='Save script as a .lil file.'
	if(type=='export_image'  )ms.type=type='save',ms.text=fieldstr(lms('image.gif'   )),ms.desc='Save a .gif image file.'
	if(type=='save_lil'      )ms.type=type='save',ms.text=fieldstr(lms('untitled.txt')),ms.desc='Save a text file.'
	if(type=='input'         )ms.text=fieldstr(lms(''))
}
export const modal_exit=value=>{
	wid=ms.old_wid
	if(ms.type=='gridcell'&&value)grid_edit_cell(ms.cell,rtext_string(ms.text.table))
	if(ms.type=='card_props'){iwrite(ifield(deck,'card'),lms('name'),rtext_string(ms.name.table)),mark_dirty()}
	if(ms.type=='grid_props'){
		const t=table_decode(rtext_string(ms.form0.table),rtext_string(ms.text.table))
		if(!match(t,ifield(ob.sel[0],'value')))ob_edit_prop('value',t)
	}
	if(ms.type=='contraption_props'){
		const w=ob.sel[0],a=ifield(w.def,'attributes');tab_get(a,'name').map((n,i)=>{
			const t=ls(tab_cell(a,'type',i));let v=lmn(attrs[i].bval)
			if(t=='number')v=lmn(ln(rtext_string(attrs[i].value.table)))
			if(t=='string')v=rtext_string(attrs[i].value.table)
			if(t=='code'  )v=rtext_string(attrs[i].value.table)
			if(t=='rich'  )v=attrs[i].value.table
			iwrite(w,n,v)
		})
	}
	if(ms.type=='action'&&value){
		let r='on click do\n'
		if(ms.act_sound)r+=`  play[${show(ms.message)}]\n`
		if(ms.act_go){
			r+='  go['
			r+=ms.act_gomode==0?'"First"': ms.act_gomode==1?'"Prev"': ms.act_gomode==2?'"Next"': ms.act_gomode==3?'"Last"': ms.act_gomode==4?'"Back"': show(ms.verb)
			if(ms.act_trans)r+=` ${show(tab_cell(ms.grid.table,'value',ms.grid.row))}`
			r+=']\n'
		}r+='end',script_save(lms(r))
	}
	if(ms.type=='recording'){
		const name=rtext_string(ms.name.table);rename_sound(deck,au.target,name)
		au.mode='stopped',modal_enter('sounds'),ms.grid.row=dkix(deck.sounds,name);return
	}
	if(ms.subtype=='confirm_new'   &&value)load_deck(deck_read(''))
	if(ms.subtype=='confirm_script'&&value)finish_script()
	if(ms.subtype=='multiscript'   &&value)setscript(ob.sel)
	if(ms.subtype=='alert_lil'  )arg(),ret(lmn(value))
	if(ms.subtype=='confirm_lil')arg(),ret(lmn(value))
	if(ms.subtype=='input_lil'  )arg(),ret(rtext_string(ms.text.table))
	if(ms.subtype=='choose_lil' )arg(),ret(ms.verb.v[ms.grid.row])
	ms.type=null
	if(ms.from_listener)modal_enter('listen')
	if(enable_touch&&ms.from_keycaps)kc.on=1
	if(ms.type==null&&uimode=='interact')msg.next_view=1
}
export const modals=_=>{
	ms.in_modal=1
	const pal=deck.patterns.pal.pix
	if(ms.type=='about'){
		const b=draw_modalbox(rect(150,70))
		if(ui_button(rect(b.x+b.w-60,b.y+b.h-20,60,20),'OK',1)||ev.exit)modal_exit(0)
		draw_text(b,`Decker v${VERSION}`,FONT_MENU,1),b.y+=15
		draw_text(b,'by John Earnest',FONT_BODY,1),b.y+=12
		draw_text(b,'beyondloom.com/decker',FONT_BODY,1)
	}
	else if(ms.type=='listen'){
		if(!kc.on){listener(rect(0,0,frame.size.x,frame.size.y));if(ev.eval)listener_eval()}
		if(ev.exit)modal_exit(0)
	}
	else if(ms.type=='cards'){
		const b=draw_modalbox(rect(210,frame.size.y-46)), gsize=rect(b.x,b.y+15,b.w,b.h-20-20)
		const slot=30,ch=slot*count(deck.cards); let m=0,props=0,gutter=-1,curr=ifield(deck,'card')
		draw_textc(rect(b.x,b.y-5,b.w,20),'Cards',FONT_MENU,1),draw_box(gsize,0,1)
		const sbar=scrollbar(gsize,max(0,ch-(gsize.h-2)),10,gsize.h,ms.grid.scroll,ch>=gsize.h,0),bb=sbar.size;ms.grid.scroll=sbar.scroll,bb.y++
		const oc=frame.clip;frame.clip=bb;for(let z=0;z<count(deck.cards);z++){
			const c=rect(bb.x,bb.y+(z*slot)-ms.grid.scroll,bb.w,slot), card=deck.cards.v[z]
			if(c.y>bb.y+bb.h||c.y+c.h<bb.y)continue; const cb=rclip(c,bb) // coarse clip
			const p=rect(c.x+2,c.y+1,40,28), t=rect(p.x+p.w+5,p.y,bb.w-(2+p.w+5+5),font_h(FONT_MENU)), s=rect(t.x,t.y+t.h+2,t.w,font_h(FONT_BODY))
			if(ev.md&&dover(cb)){m=1,n_go([card],deck),curr=card,ms.grid.row=z}if(ev.dclick&&over(cb))props=1
			const col=ev.drag&&ms.grid.row==z?13:1
			draw_text_fit(t,ls(ifield(card,'name')),FONT_MENU,col)
			draw_text_fit(s,`${count(card.widgets)} widget${count(card.widgets)==1?'':'s'}`,FONT_BODY,col),draw_box(p,0,col)
			if(card==curr&&col==1)draw_invert(pal,c);draw_thumbnail(card,p)
			if((ev.drag||ev.mu)&&ms.grid.row!=-1){
				{const g=rect(c.x,c.y-3    ,c.w,7);if(over(g)){draw_hline(c.x,c.x+c.w,c.y      ,13),gutter=z  }}
				{const g=rect(c.x,c.y-3+c.h,c.w,7);if(over(g)){draw_hline(c.x,c.x+c.w,c.y+c.h-1,13),gutter=z+1}}
			}
		};frame.clip=oc
		if(ui_button(rect(b.x+b.w-60,b.y+b.h-20,60,20),'OK',1)||ev.exit||ev.action)modal_exit(0)
		const c=rect(b.x,b.y+b.h-20)
		if(ui_button(rect(c.x,c.y,60,20),'New',1)){
			const c=deck_add(deck,lms('card')),n=ln(ifield(curr,'index'))
			iwrite(c,lms('index'),lmn(n+1)),m=1,n_go([c],deck)
		}c.x+=65
		if(ev.mu){
			if(ms.grid.row!=-1&&gutter!=-1){
				const s=deck.cards.v[ms.grid.row], oi=ln(ifield(s,'index'))
				iwrite(s,lms('index'),lmn(gutter>oi?gutter-1:gutter)),m=1,n_go([s],deck)
			}ms.grid.row=-1
		}
		else if(ev.drag&&ms.grid.row!=-1){const r=rect(ev.pos.x-5,ev.pos.y-5,10,10);draw_rect(r,0),draw_box(r,0,1),uicursor=cursor.drag}
		else if(ev.dir=='up'  &&ev.shift){iwrite(curr,lms('index'),lmn(ln(ifield(curr,'index'))-1)),m=1,n_go([curr],deck)}
		else if(ev.dir=='down'&&ev.shift){iwrite(curr,lms('index'),lmn(ln(ifield(curr,'index'))+1)),m=1,n_go([curr],deck)}
		else if(ev.dir=='left' ||ev.dir=='up'  ){m=1,n_go([lms('Prev')],deck)}
		else if(ev.dir=='right'||ev.dir=='down'){m=1,n_go([lms('Next')],deck)}
		if(m){
			curr=ifield(deck,'card');const y=(ln(ifield(curr,'index'))*slot)-ms.grid.scroll
			if(y<0){ms.grid.scroll+=y}if(y+slot>=bb.h){ms.grid.scroll+=(y+slot)-bb.h}
		}if(props)modal_enter('card_props')
	}
	else if(ms.type=='orderwids'){
		const b=draw_modalbox(rect(210,frame.size.y-46)),def=con(),wids=ll(ifield(def,'widgets'))
		draw_textc(rect(b.x,b.y-5,b.w,20),'Widget Order',FONT_MENU,1)
		const gsize=rect(b.x,b.y+15,b.w,b.h-20-20), slot=16, ch=slot*wids.length
		let m=ms.grid.col==-99?-1:0, props=0, gutter=-1; draw_box(gsize,0,1)
		const sbar=scrollbar(gsize,max(0,ch-(gsize.h-2)),10,gsize.h,ms.grid.scroll,ch>=gsize.h,0),bb=sbar.size;ms.grid.scroll=sbar.scroll,bb.y++
		const oc=frame.clip;frame.clip=bb;for(let z=0;z<wids.length;z++){
			const c=rect(bb.x,bb.y+(z*slot)-ms.grid.scroll,bb.w,slot), wid=wids[z]
			if(c.y>bb.y+bb.h||c.y+c.h<bb.y)continue; const cb=rclip(c,bb) // coarse clip
			if(ev.dclick&&over(cb))props=1
			if(ev.md&&dover(cb)){
				if(ev.shift){if(ob.sel.indexOf(wid)>=0){ob.sel=ob.sel.filter(x=>x!=wid),props=0}else{ob.sel.push(wid)}}
				else{object_select(wid),ms.grid.row=z}
			}
			const col=ev.drag&&ms.grid.row==z?13:1
			draw_text_fit(rect(c.x+3,c.y+2,bb.w-6,font_h(FONT_BODY)),ls(ifield(wid,'name')),FONT_BODY,col)
			if(ls(ifield(wid,'script')).length){
				const i=rect(c.x+c.w-13,c.y+2,12,12)
				draw_rect(rect(i.x+2,i.y+1,i.w-2,i.h-2),0),draw_icon(i,ICONS[ICON.lil],1)
			}
			if(ob.sel.indexOf(wid)>=0)draw_invert(pal,c)
			if((ev.drag||ev.mu)&&ms.grid.row!=-1){
				{const g=rect(c.x,c.y-3    ,c.w,7);if(over(g)){draw_hline(c.x,c.x+c.w,c.y      ,13),gutter=z  }}
				{const g=rect(c.x,c.y-3+c.h,c.w,7);if(over(g)){draw_hline(c.x,c.x+c.w,c.y+c.h-1,13),gutter=z+1}}
			}
		}frame.clip=oc
		if(ui_button(rect(b.x+b.w-60,b.y+b.h-20,60,20),'OK',1)||ev.exit)modal_exit(0)
		const c=rect(b.x,b.y+b.h-20)
		if(ui_button(rect(c.x,c.y,80,20),'Properties...',ob.sel.length==1)||props)if(ob.sel.length)object_properties(ob.sel[0])
		if(ev.mu){
			if(ms.grid.row!=-1&&gutter!=-1){
				const s=wids[ms.grid.row], oi=ln(ifield(s,'index'))
				iwrite(s,lms('index'),lmn(gutter>oi?gutter-1:gutter)),m=1,object_select(s)
			}ms.grid.row=-1
		}
		else if(ev.drag&&ms.grid.row!=-1){const r=rect(ev.pos.x-5,ev.pos.y-5,10,10);draw_rect(r,0),draw_box(r,0,1),uicursor=cursor.drag}
		else if(ev.shift     &&ev.dir=='up'  ){ob_move_dn(),m=-1}
		else if(ev.shift     &&ev.dir=='down'){ob_move_up(),m= 1}
		else if(ob.sel.length&&ev.dir=='up'  ){ob_order(),object_select(wids[mod(ln(ifield(ob.sel[0              ],'index'))-1,wids.length)]),m=-1}
		else if(ob.sel.length&&ev.dir=='down'){ob_order(),object_select(wids[mod(ln(ifield(ob.sel[ob.sel.length-1],'index'))+1,wids.length)]),m= 1}
		if(m!=0&&ob.sel.length){
			ms.grid.col=-1;ob_order();const target=m==-1?ob.sel[0]:ob.sel[ob.sel.length-1]
			const y=(ln(ifield(target,'index'))*slot)-ms.grid.scroll
			if(y<0){ms.grid.scroll+=y}if(y+slot>=bb.h){ms.grid.scroll+=(y+slot)-bb.h}
		}
	}
	else if(ms.type=='sounds'){
		const b=draw_modalbox(rect(250,frame.size.y-16-30)), gsize=rect(b.x,b.y+15,b.w,b.h-16-(2*25))
		draw_textc(rect(b.x,b.y-5,b.w,20),'Sounds',FONT_MENU,1)
		const s=ms.grid.row>=0?dget(deck.sounds,tab_cell(ms.grid.table,'name',ms.grid.row)):null
		if(ui_table(gsize,[16,130],'Isss',ms.grid))n_play([s])
		if(ui_button(rect(b.x+b.w-60,b.y+b.h-20,60,20),'OK',1)||ev.exit){
			if(ms.from_action){
				if(ms.grid.row>=0)ms.message=deck.sounds.k[ms.grid.row]
				ms.grid=gridtab(transit_enumerate(),ms.act_transno),ms.type='action',ms.from_action=0
			}else{modal_exit(1)}
		}
		const c=rect(b.x,b.y+b.h-20)
		if(ui_button(rect(c.x,c.y,60,20),'Edit...',s!=null))au.target=s,modal_enter('recording')
		if(ui_button(rect(c.x,c.y-25,60,20),'New...',1))au.target=deck_add(deck,lms('sound')),mark_dirty(),modal_enter('recording');c.x+=65
		if(ui_button(rect(c.x,c.y,60,20),"Delete",s!=null))deck_remove(deck,s),mark_dirty(),ms.grid=gridtab(sounds_enumerate())
	}
	else if(ms.type=='recording'){
		const b=draw_modalbox(rect(frame.size.x-50,130)), samples=max(1,ln(ifield(au.target,'size')))
		draw_textc(rect(b.x,b.y-5,b.w,20),'Audio Editor',FONT_MENU,1)
		au.head=clamp(0,au.head,samples), au.sel.x=clamp(0,au.sel.x,samples), au.sel.y=clamp(0,au.sel.y,samples)
		const gsize=rect(b.x,b.y+15,b.w,64), lsize=rint(rect(b.x,gsize.y+gsize.h+2,b.w/2,font_h(FONT_BODY)))
		const sndpos=x=>0|(x*((gsize.w*1.0)/samples))
		const possnd=x=>0|max(0,min(samples-1,((x/gsize.w)*samples)))
		if((ev.mu||ev.drag)&&dover(gsize)&&au.mode=='stopped'){
			const x=possnd(ev.dpos.x-gsize.x),y=possnd(ev.pos.x-gsize.x);field_exit()
			if(ev.mu)au.head=y;if(ev.drag)au.sel=rect(min(x,y),max(x,y)),au.head=au.sel.x
		}
		const sel=au.sel, sc=sel.y-sel.x, oc=frame.clip
		frame.clip=gsize;for(let z=0;z<gsize.w;z++){
			let v=0,base=possnd(z);for(let d=-1;d<=1;d++){
				if(base+d<0||base+d>=samples)continue;let s=byte_to_sample(au.target.data[base+d]);if(Math.abs(s)>Math.abs(v))v=s
			}let vp=0|(v*64);draw_vline(gsize.x+z,gsize.y+32,gsize.y+32+vp,1),draw_vline(gsize.x+z,gsize.y+32-vp,gsize.y+32,1)
		}frame.clip=oc
		if(sc)draw_invert(pal,rect(gsize.x+sndpos(sel.x),gsize.y,sndpos(sel.y)-sndpos(sel.x),gsize.h))
		draw_invert(pal,rect(gsize.x+sndpos(au.head)-1,gsize.y,3,gsize.h)),draw_box(gsize,0,1)
		const t=sc==0?ls(dyad.format(lms('%0.2fkb, %0.2fs'         ),lml([lmn(samples/1000.0*1.33),ifield(au.target,'duration')]))):
		              ls(dyad.format(lms('%0.2fkb, %0.2fs selected'),lml([lmn(sc     /1000.0*1.33),lmn(sc/SFX_RATE            )])))
		draw_text_fit(lsize,t,FONT_BODY,1)
		if(ui_button(rect(b.x+b.w-60,b.y+b.h-20,60,20),'OK',1)||ev.exit)modal_exit(0)
		const c=rect(b.x,b.y+b.h-20)
		if(ui_toggle(rect(c.x,c.y,60,20),'Play',au.mode=='playing',1)){
			if(au.mode=='recording')sound_finish()
			au.head=sc?au.sel.x:0;if(au.mode=='playing'){stop_sound_pump()}else{play_sound_pump(sound_selected())}
		};c.x+=65
		if(ui_toggle(rect(c.x,c.y,60,20),'Record',au.mode=='recording',!au.norecord)){
			if(au.mode=='recording'){sound_finish()}else{sound_record()}
		};c.x+=65
		if(ui_button(rect(c.x,c.y,60,20),'Crop',sc&&au.mode=='stopped'))sound_edit(sound_slice(au.sel)),au.sel=rect(),au.head=0
		draw_text(rect(b.x+(b.w/2),gsize.y+gsize.h+9,37,20),'Name',FONT_MENU,1)
		ui_field(rint(rect(b.x+(b.w/2)+37,gsize.y+gsize.h+5,(b.w/2)-37,20)),ms.name)
	}
	else if(ms.type=='fonts'){
		const b=draw_modalbox(rect(170,170))
		draw_textc(rect(b.x,b.y-5,b.w,20),'Fonts',FONT_MENU,1)
		const gsize=rect(b.x,b.y+15,b.w,b.h-20-50-25)
		if(ms.grid.scroll==-99){ms.grid.scroll=grid_scrollto(ms.grid.table,{size:gsize,font:FONT_BODY,headers:0},-1,ms.grid.row)}
		const choose=ui_table(gsize,[16],'Is',ms.grid)
		let psize=rect(b.x,gsize.y+gsize.h+5,b.w,50);draw_box(psize,0,1),psize=inset(psize,2)
		if(ms.grid.row>=0){
			const l=layout_plaintext(PANGRAM,deck.fonts.v[ms.grid.row],ALIGN.left,rect(psize.w,psize.h));draw_text_wrap(psize,l,1)}
		const c=rect(b.x+b.w-60,b.y+b.h-20)
		if(ui_button(rect(c.x,c.y,60,20),'OK',ms.grid.row>=0)||choose){
			const nf=tab_cell(ms.grid.table,'name',ms.grid.row),nested=ms_stack.length>0;modal_pop(1)
			if(uimode=='object'&&!nested){ob_edit_prop('font',nf)}
			else if(wid.fv&&wid.cursor.x!=wid.cursor.y){const c=wid.cursor;field_stylespan(nf,lms('')),wid.cursor=c,mark_dirty()}
			else if(wid.ft){iwrite(wid.ft,lms('font'),nf),wid.f=unpack_field(ms.old_wid.ft),wid.fv=unpack_field_value(ms.old_wid.ft),mark_dirty()}
		};c.x-=65
		if(ui_button(rect(c.x,c.y,60,20),'Cancel',1)||ev.exit)modal_pop(0)
	}
	else if(ms.type=='contraptions'||ms.type=='pick_contraption'){
		const b=draw_modalbox(rect(250,230))
		draw_textc(rect(b.x,b.y-5,b.w,20),ms.type=='contraptions'?'Contraption Prototypes':'New Contraption',FONT_MENU,1)
		const gsize=rect(b.x,b.y+15,b.w,b.h-20-50-25-(ms.type=='contraptions'?25:0))
		const choose=ui_table(gsize,[16],'Is',ms.grid)
		let psize=rect(b.x,gsize.y+gsize.h+5,b.w,50);draw_box(psize,0,1),psize=inset(psize,2)
		if(ms.grid.row>=0){
			const desc=ls(ifield(deck.contraptions.v[ms.grid.row],'description'))
			const l=layout_plaintext(desc,FONT_BODY,ALIGN.left,rect(psize.w,psize.h));draw_text_wrap(psize,l,1)
		}
		const c=rect(b.x+b.w-60,b.y+b.h-20)
		if(ms.type=='contraptions'){
			if(ui_button(rect(b.x+b.w-60,b.y+b.h-20,60,20),'OK',1)||ev.exit){modal_exit(0)}
			if(ui_button(rect(b.x,b.y+b.h-45,60,20),'New...',1)){modal_exit(1),con_set(deck_add(deck,lms('contraption'))),mark_dirty()}
			if(ui_button(rect(b.x,b.y+b.h-20,60,20),'Edit...',ms.grid.row>=0)||choose){modal_exit(2),con_set(deck.contraptions.v[ms.grid.row])}
			if(ui_button(rect(b.x+65,b.y+b.h-45,60,20),'Clone',ms.grid.row>=0)||choose){
				const s=ifield(deck,'contraptions').v[ms.grid.row]
				deck_add(deck,s,lms(ls(ifield(s,'name'))+'_clone'))
				ms.grid=gridtab(contraptions_enumerate())
			}
			if(ui_button(rect(b.x+65,b.y+b.h-20,60,20),'Delete',ms.grid.row>=0||choose)){
				deck_remove(deck,ifield(deck,'contraptions').v[ms.grid.row])
				ms.grid=gridtab(contraptions_enumerate())
			}
		}
		if(ms.type=='pick_contraption'){
			if(ui_button(rect(c.x,c.y,60,20),'Create',ms.grid.row>=0)||choose){
				ob_create([lmd(['type','def'].map(lms),[lms('contraption'),tab_cell(ms.grid.table,'name',ms.grid.row)])]),modal_exit(1)
			};c.x-=65
			if(ui_button(rect(c.x,c.y,60,20),'Cancel',1)||ev.exit)modal_exit(0)
		}
	}
	else if(ms.type=='contraption_props'){
		const b=draw_modalbox(rect(240,240)),contraption=ob.sel[0]
		draw_textc(rect(b.x,b.y-5,b.w,20),`${title_caps(contraption.def.name)} Properties`,FONT_MENU,1)
		draw_text(rect(b.x,b.y+22,47,20),'Name',FONT_MENU,1)
		ui_field (rect(b.x+47  ,b.y+20  ,b.w-47,18),ms.name)
		iwrite(contraption,lms('name'),rtext_string(ms.name.table)),mark_dirty()
		widget_attributes(rect(b.x,b.y+42,b.w,b.h-42-25))
		const c=rect(b.x,b.y+b.h-20)
		if(ui_button(rect(c.x,c.y,60,20),'Script...',1))modal_exit(0),setscript(contraption);c.x+=65
		if(ui_button(rect(c.x,c.y,80,20),'Prototype...',1))modal_exit(1),con_set(contraption.def)
		if(ui_button(rect(b.x+b.w-60,c.y,60,20),'OK',1)||ev.exit)modal_exit(1)
	}
	else if(ms.type=='prototype_props'){
		const b=draw_modalbox(rect(220,230)),def=con(), lw=67
		draw_textc(rect(b.x,b.y-5,b.w,20),'Prototype Properties',FONT_MENU,1)
		draw_text(rect(b.x,b.y+ 22,lw,20),'Name',FONT_MENU,1)
		draw_text(rect(b.x,b.y+ 42,lw,20),'Version',FONT_MENU,1)
		draw_text(rect(b.x,b.y+ 62,lw,20),'Description',FONT_MENU,1)
		draw_text(rect(b.x,b.y+122,lw,20),'Template\nScript',FONT_MENU,1)
		ui_field   (rect(b.x+lw,b.y+20 ,b.w-lw,18),ms.name)
		ui_field   (rect(b.x+lw,b.y+40 ,b.w-lw,18),ms.form2)
		ui_textedit(rect(b.x+lw,b.y+60 ,b.w-lw,58),1,ms.form0)
		ui_codeedit(rect(b.x+lw,b.y+120,b.w-lw,78),1,ms.form1)
		iwrite(def,lms('name'       ),rtext_string(ms.name .table))
		iwrite(def,lms('version'    ),rtext_string(ms.form2.table))
		iwrite(def,lms('description'),rtext_string(ms.form0.table))
		iwrite(def,lms('template'   ),rtext_string(ms.form1.table)),mark_dirty()
		const c=rect(b.x,b.y+b.h-20)
		if(ui_button(rect(c.x,c.y,60,20),'Script...',1))modal_exit(1),setscript(def);c.x+=65
		if(ui_button(rect(b.x+b.w-60,c.y,60,20),'OK',1)||ev.exit)modal_exit(0)
	}
	else if(ms.type=='prototype_attrs'){
		const b=draw_modalbox(rect(220,200)),def=con(), lw=42
		draw_textc(rect(b.x,b.y-5,b.w,20),`${title_caps(def.name)} Attributes`,FONT_MENU,1)
		const gsize=rect(b.x,b.y+20,80,b.h-(20+5+20))
		const before=ms.grid.row;ui_table(gsize,[gsize.w-18],'s',ms.grid)
		if(before!=ms.grid.row||ms.name.table==null||ms.text.table==null){
			ms.name=fieldstr(ms.grid.row>=0?tab_cell(ms.grid.table,'name' ,ms.grid.row):lms(''))
			ms.text=fieldstr(ms.grid.row>=0?tab_cell(ms.grid.table,'label',ms.grid.row):lms(''))
		}
		const sel=ms.grid.row>=0
		draw_text(rect(gsize.x+gsize.w+10,b.y+20+2,lw,20),'Name' ,FONT_MENU,1)
		draw_text(rect(gsize.x+gsize.w+10,b.y+40+2,lw,20),'Label',FONT_MENU,1)
		draw_text(rect(gsize.x+gsize.w+10,b.y+60+2,lw,20),'Type' ,FONT_MENU,1)
		ui_dfield(rect(gsize.x+gsize.w+5+lw,b.y+20,b.w-(lw+5+gsize.w),18),sel,ms.name)
		ui_dfield(rect(gsize.x+gsize.w+5+lw,b.y+40,b.w-(lw+5+gsize.w),18),sel,ms.text)
		if(sel){
			tab_get(ms.grid.table,'name' )[ms.grid.row]=rtext_string(ms.name.table)
			tab_get(ms.grid.table,'label')[ms.grid.row]=rtext_string(ms.text.table)
		}
		const cr=rect(gsize.x+gsize.w+5+lw,b.y+62), c=rect(b.x,b.y+b.h-20)
		const attr_types=['bool','number','string','code','rich']
		const attr_labels=['Boolean','Number','String','Code','Rich Text']
		const t=sel?ls(tab_cell(ms.grid.table,'type',ms.grid.row)):''
		for(let z=0;z<attr_types.length;z++,cr.y+=16)if(ui_radio(rect(cr.x,cr.y,b.w-(lw+5+gsize.w),16),attr_labels[z],sel,t==attr_types[z])){
			tab_get(ms.grid.table,'type')[ms.grid.row]=lms(attr_types[z])
		}
		if(ui_button(rect(c.x,c.y,60,20),'Add',1)){
			tab_get(ms.grid.table,'name' ).push(lms('untitled'))
			tab_get(ms.grid.table,'label').push(lms(''))
			tab_get(ms.grid.table,'type' ).push(lms('bool'))
			ms.grid.row=count(ms.grid.table)-1,ms.name.table=null,ms.text.table=null
		};c.x+=65
		if(ui_button(rect(c.x,c.y,60,20),'Remove',sel)){
			ms.grid.table=dyad.drop(lml([lmn(ms.grid.row)]),ms.grid.table)
			ms.grid.row=-1,ms.name.table=null,ms.text.table=null
		}
		if(ui_button(rect(b.x+b.w-60,c.y,60,20),'OK',1)||ev.exit){iwrite(def,lms('attributes'),ms.grid.table),mark_dirty(),modal_exit(1)}
	}
	else if(ms.type=='resources'){
		const b=draw_modalbox(rect(320,190))
		draw_textc(rect(b.x,b.y-5,b.w,20),'Font/Deck Accessory Mover',FONT_MENU,1)
		const lgrid=rect(b.x            ,b.y+15 ,100    ,b.h-(15+15+5+20))
		const rgrid=rect(b.x+b.w-lgrid.w,lgrid.y,lgrid.w,lgrid.h         )
		if(ui_button(rect(rgrid.x+(rgrid.w-80)/2,b.y+b.h-20,80,20),'OK',1)||ev.exit)modal_exit(0)
		ui_table(lgrid,[16,lgrid.w-38],'Is',ms.grid );if(ms.grid .row>-1)ms.grid2.row=-1
		ui_table(rgrid,[16,rgrid.w-38],'Is',ms.grid2);if(ms.grid2.row>-1)ms.grid .row=-1
		draw_vline(lgrid.x+lgrid.w,lgrid.y+lgrid.h+5,b.y+b.h,18)
		draw_vline(rgrid.x        ,rgrid.y+rgrid.h+5,b.y+b.h,18)
		draw_textc(rect(lgrid.x,lgrid.y+lgrid.h+3,lgrid.w,15),ms.message?ls(ifield(ms.message,'name')):'(Choose a Deck)',FONT_BODY,1)
		draw_textc(rect(rgrid.x,rgrid.y+rgrid.h+3,rgrid.w,15),ls(ifield(deck,'name')),FONT_BODY,1)
		const cb=rect(lgrid.x+lgrid.w+5,lgrid.y+5,b.w-(lgrid.w+5+5+rgrid.w),20)
		const rvalue=(g,k)=>tab_cell(g.table,k,g.row)
		let sel=(ms.grid.table&&ms.grid.row>-1)?rvalue(ms.grid,'value'): ms.grid2.row>-1?rvalue(ms.grid2,'value'): null
		let copy_message='>> Copy >>',can_copy=1
		if(ms.grid.row>-1&&sel&&(module_is(sel)||prototype_is(sel))){
			const name=ifield(sel,'name');let sver=ln(ifield(sel,'version')),dver=sver;can_copy=0
			if(module_is   (sel)){const v=dget(deck.modules     ,name);if(v){dver=ln(ifield(v,'version'))}else{can_copy=1}}
			if(prototype_is(sel)){const v=dget(deck.contraptions,name);if(v){dver=ln(ifield(v,'version'))}else{can_copy=1}}
			if(sver>dver)can_copy=1,copy_message='>> Upgrade >>'
			if(sver<dver)can_copy=1,copy_message='>> Downgrade >>'
		}
		if(ui_button(cb,copy_message,can_copy&&ms.grid.row>-1)){
			if(patterns_is(sel)){const dst=ifield(deck,'patterns');for(let z=2;z<=47;z++)iindex(dst,z,iindex(sel,z))}
			else if(module_is(sel)||prototype_is(sel)){deck_add(deck,sel)}
			else{deck_add(deck,sel,rvalue(ms.grid,'name'))}
			ms.grid2=gridtab(res_enumerate(deck)),mark_dirty();if(module_is(sel))validate_modules()
		}cb.y+=25
		if(ui_button(cb,'Remove',ms.grid2.row>-1)){
			if(patterns_is(sel)){deck.patterns=patterns_read(lmd())}
			else{deck_remove(deck,rvalue(ms.grid2,'value'))}
			ms.grid2=gridtab(res_enumerate(deck)),mark_dirty(),sel=null
		}cb.y+=25
		const pre=rect(cb.x,cb.y,cb.w,b.h-(cb.y-b.y))
		if(sel&&font_is(sel)){const l=layout_plaintext(PANGRAM,sel,ALIGN.center,rect(pre.w,pre.h));draw_text_wrap(pre,l,1)}
		if(sel&&(module_is(sel)||prototype_is(sel))){
			draw_textc(rect(pre.x,pre.y+pre.h-18,pre.w,18),ls(dyad.format(lms('version %f'),ifield(sel,'version'))),FONT_BODY,1);pre.h-=20
			const l=layout_plaintext(ls(ifield(sel,'description')),FONT_BODY,ALIGN.center,rect(pre.w,pre.h));draw_text_wrap(pre,l,1)
		}
		if(sel&&sound_is(sel)){if(ui_button(cb,'Play',1))n_play([sel])}
		if(sel&&patterns_is(sel)){
			const c=frame.clip,pal=sel.pal.pix;frame.clip=pre;
			const anim_ants   =(x,y)=>(0|((x+y+(0|(frame_count/2)))/3))%2?15:0
			const draw_pattern=(pix,x,y)=>pix<2?(pix?1:0): pix>31?(pix==32?0:1): pal_pat(pal,pix,x,y)&1
			const draw_color  =(pix,x,y)=>pix==ANTS?anim_ants(x,y): pix>47?0: pix>31?pix-32: draw_pattern(pix,x,y)?15:0
			for(let z=0;z<32;z++)for(let y=0;y<16;y++)for(let x=0;x<16;x++){
				const h=rect(3+x+pre.x+16*(z%(0|(pre.w/16))), y+pre.y+16*(0|(z/(0|(pre.w/16)))))
				if(inclip(h))pix(h,32+draw_color(z,x,y))
			}frame.clip=c
		}
		ui_button(rint(rect(lgrid.x+(lgrid.w-80)/2,b.y+b.h-20,80,20)),'Choose...',1,_=>open_text('.html,.deck',text=>{
			ms.message=deck_read(text),ms.grid=gridtab(res_enumerate(ms.message))
		}))
	}
	else if(ms.type=='query'){
		const b=draw_modalbox(rect(frame.size.x-30,frame.size.y-16-30)),t=ms.grid.table
		const desc=t?`${tab_cols(t).length} column${tab_cols(t).length==1?'':'s'}, ${count(t)} row${count(t)==1?'':'s'}.`:'Executing Query.'
		let compiles=0,error=' ';try{parse(ls(rtext_string(ms.text.table))),compiles=1}catch(e){error=e.x}
		const dsize=font_textsize(FONT_BODY,desc);draw_text(b,desc,FONT_BODY,1)
		const msize=font_textsize(FONT_BODY,error), gsize=rint(rect(b.x,b.y+dsize.y,b.w,(b.h-(2*5)-dsize.y-20)/2))
		const esize=rect(b.x,gsize.y+gsize.h+5,b.w,gsize.h-msize.y);ui_codeedit(esize,1,ms.text)
		if(!compiles)draw_text_fit(rect(b.x,esize.y+esize.h,b.w,msize.y),error,FONT_BODY,1)
		const c=rect(b.x+b.w-60,b.y+b.h-20)
		if(ui_button(rect(c.x,c.y,60,20),'Run',compiles)||ev.eval){
			try{
				const prog=parse(ls(rtext_string(ms.text.table)))
				blk_opa(prog,op.BUND,1),blk_lit(prog,lmnat(n_post_query)),blk_op(prog,op.SWAP),blk_op(prog,op.CALL)
				fire_hunk_async(ms.old_wid.gt,prog),ms.grid=gridtab(null)
			}catch(e){console.log(e)}
		}c.x-=65
		if(ui_button(rect(c.x,c.y,60,20),'Apply',ms.grid.table!=null&&ms.grid.table!=ms.old_wid.gv.table&&!ms.old_wid.g.locked)){
			const t=ms.grid.table;modal_exit(0),grid_edit(t)
			listen_show(ALIGN.right,1,lms('applied table query:')),listen_show(ALIGN.left,1,rtext_string(ms.text.table))
		}c.x-=65
		if(ui_button(rect(c.x,c.y,60,20),'Close',1)||ev.exit)modal_exit(0)
		if(ms.grid.table){widget_grid(null,{size:gsize,font:FONT_MONO,widths:[],format:'',headers:1,scrollbar:1,lines:1,bycell:0,show:'solid',locked:1},ms.grid)}
		else{draw_box(gsize,0,1),draw_textc(gsize,'Working...',FONT_BODY,1)}
	}
	else if(ms.type=='url'){
		const b=draw_modalbox(rect(200,90))
		draw_textc(rect(b.x,b.y,b.w,20),'Do you wish to open this URL?',FONT_BODY,1)
		ui_textedit(rect(b.x,b.y+20+5,b.w,40),1,ms.text)
		const c=rect(b.x+b.w-(b.w-(2*60+5))/2-60,b.y+b.h-20)
		ui_button(rect(c.x,c.y,60,20),'Open',1,_=>{open_url(ls(rtext_string(ms.text.table)));modal_exit(0)});c.x-=65
		if(ui_button(rect(c.x,c.y,60,20),'Cancel',1)||ev.exit)modal_exit(0)
	}
	else if(ms.type=='link'){
		const b=draw_modalbox(rect(230,70))
		draw_textc(rect(b.x,b.y,b.w,20),kc.heading='Enter a link string for\nthe selected text span:',FONT_BODY,1)
		ui_field(rect(b.x,b.y+20+5,b.w,20),ms.text)
		const c=rect(b.x+b.w-60,b.y+b.h-20)
		if(ui_button(rect(c.x,c.y,60,20),'OK',1))modal_pop(1);c.x-=65
		if(ui_button(rect(c.x,c.y,60,20),'Cancel',1)||ev.exit)modal_pop(0)
		if(ui_button(rect(b.x,c.y,60,20),'Card...',1))modal_push('pick_card')
	}
	else if(ms.type=='gridcell'){
		const c=ms.pending_grid_cell
		draw_rect(inset(c,-2),32),draw_box(inset(c,-2),0,1)
		ui_field(c,ms.text)
		if(ev.click&&!over(c))modal_exit(1)
		if(ev.exit)modal_exit(0)
	}
	else if(ms.type=='save'){
		const l=layout_plaintext(ms.desc,FONT_BODY,ALIGN.center,rect(250,100))
		const b=draw_modalbox(radd(l.size,rect(0,20+5+20+5+20))), tbox=rect(b.x,b.y+20,b.w,l.size.y)
		draw_textc(rect(b.x,b.y-5,b.w,20),'Save File',FONT_MENU,1),draw_text_wrap(tbox,l,1)
		draw_text(rect(b.x   ,tbox.y+tbox.h+7,    56,20),'Filename',FONT_MENU,1)
		ui_field (rect(b.x+56,tbox.y+tbox.h+5,b.w-56,18),ms.text)
		const c=rect(b.x+b.w-60,b.y+b.h-20),subtype=ms.subtype
		if(ui_button(rect(c.x,c.y,60,20),'Save',1,_=>{
			const name=ls(rtext_string(ms.text.table))
			const savedeck=_=>{
				let d=deck_write(deck)
				if(/\.html$/i.test(name)){q('script[language="decker"]').innerHTML='\n'+d,d=`<body>${q('#decker_root').innerHTML}</body>`}
				dirty=0,save_text(name,d)
			}
			const save_image=_=>{
				if(bg_has_sel()){const s=rcopy(dr.sel_here);bg_end_selection(),dr.sel_here=s}
				let i=draw_con(con(),1),off=rect(),f=1,a=0, bg=dr.trans?0:32, frames=[]
				const anim=deck.patterns.anim
				const anim_pattern=(pix,x,y,f)=>pix<28||pix>31?pix: anim[pix-28][f%max(1,anim[pix-28].length)]
				const draw_pattern=(pix,x,y  )=>pix<2?(pix?1:0): pix>31?(pix==32?0:1): pal[(x%8)+(8*(y%8))+(8*8*pix)]&1
				if(bg_has_sel()||bg_has_lasso()){const r=rclip(dr.sel_here,con_dim());i=image_copy(i,r),off=rcopy(r)}
				for(let z=0;z<4&&dr.show_anim;z++){const c=anim[z].length;if(c)f=lcm(f,c)}
				for(let z=0;z<f;z++){
					const frame=image_copy(i)
					for(let y=0;y<i.size.y;y++)for(let x=0;x<i.size.x;x++){
						const v=frame.pix[x+(i.size.x*y)];if(v>=28&&v<=31)a=1
						const c=anim_pattern(v,x,y,z),p=draw_pattern(c,x+off.x,y+off.y)
						frame.pix[x+(i.size.x*y)]=c>=32?c: p?1:bg
					}frames.push(bg_has_lasso()?image_mask(frame,dr.mask):frame)
				}save_bin(name,writegif(a?frames:[frames[0]], a?frames.map(x=>10):[10]))
			}
			if(subtype=='save_deck'    )savedeck()
			if(subtype=='save_locked'  )iwrite(deck,lms('locked'),ONE),savedeck(),iwrite(deck,lms('locked'),NONE)
			if(subtype=='export_script')save_text(name,ls(rtext_string(sc.f.table)))
			if(subtype=='export_image' )save_image()
			if(subtype=='save_lil'){
				let x=ms.verb;arg();ret(ONE)
				let f=image_is(x)?[x]:     lid(x)?ll(dget(x,lms('frames'))||lml([])): lil(x)?ll(x): []
				let d=image_is(x)?lml([]): lid(x)?   dget(x,lms('delays'))||lml([] ): lml([])
				let ff=[],fd=[];f.map((v,i)=>{if(image_is(v))ff.push(v),fd.push(0|clamp(1,!lil(d)?ln(d): i>=count(d)?3: ln(d.v[i]),65535))})
				if((lil(x)||lid(x)||image_is(x))&&f.length){save_bin(name,writegif(ff,fd))}
				else if(sound_is(x))                       {save_bin(name,writewav(x))}
				else if(array_is(x))                       {save_bin(name,writearray(x))}
				else                                       {save_text(name,ls(x))}
			}
		}))modal_exit(1);c.x-=65;
		if(ui_button(rect(c.x,c.y,60,20),'Cancel',1)||ev.exit)modal_exit(0)
	}
	else if(ms.type=='alert'){
		const b=draw_modal_rtext(rect(0,5+20))
		if(ui_button(rect(b.x+b.w-60,b.y+b.h-20,60,20),'OK',1)||ev.exit)modal_exit(0)
	}
	else if(ms.type=='confirm'){
		const b=draw_modal_rtext(rect(0,5+20)),v=ms.verb?ls(ms.verb):'OK'
		const vs=font_textsize(FONT_MENU,v);vs.x=min(max(60,vs.x+10),200-65);const c=rect(b.x+b.w-vs.x,b.y+b.h-20)
		if(ui_button(rect(c.x,c.y,vs.x,20),v,1))modal_exit(1);c.x-=65
		if(ui_button(rect(c.x,c.y,60,20),'Cancel',1)||ev.exit)modal_exit(0)
	}
	else if(ms.type=='input'){
		const b=draw_modal_rtext(rect(0,5+20+5+20))
		ui_field(rect(b.x,b.y+b.h-(20+5+20),b.w,20),ms.text)
		if(ui_button(rect(b.x+b.w-60,b.y+b.h-20,60,20),'OK',1)||ev.exit)modal_exit(0)
	}
	else if(ms.type=='choose_lil'){
		const b=draw_modal_rtext(rect(0,5+80+5+20))
		const choose=ui_table(rect(b.x,b.y+b.h-(20+5+80),b.w,80),[],'s',ms.grid)
		if(ui_button(rect(b.x+b.w-60,b.y+b.h-20,60,20),'OK',ms.grid.row>=0)||choose)modal_exit(1)
	}
	else if(ms.type=='open_lil'){
		const b=draw_modalbox(rect(125,45))
		draw_textc(rect(b.x,b.y,b.w,16),'Click to open a file:',FONT_BODY,1)
		const c=rect(b.x+b.w-60,b.y+b.h-20)
		ui_button(rect(c.x,c.y,60,20),'Open',1,_=>{
			if     (ls(ms.verb)=='array'  )open_file(ms.filter,file=>{load_array(file,        array=>{arg(),ret(array)    ,modal_exit(1)})})
			else if(ms.filter=='image/*'  )open_file(ms.filter,file=>{load_image(file,ms.verb,image=>{arg(),ret(image)    ,modal_exit(1)})})
			else if(ms.filter=='audio/*'  )open_file(ms.filter,file=>{load_sound(file,        sound=>{arg(),ret(sound)    ,modal_exit(1)})})
			else if(ms.filter=='.csv,.txt')open_text(ms.filter,                               text =>{arg(),ret(lms(text)),modal_exit(1)  })
			else                           open_text(''       ,                               text =>{arg(),ret(lms(text)),modal_exit(1)  })
		}),c.x-=65
		if(ui_button(rect(c.x,c.y,60,20),'Cancel',1)||ev.exit)modal_exit(0)
	}
	else if(ms.type=='fullscreen_lil'){
		const b=draw_modalbox(rect(150,45))
		draw_textc(rect(b.x,b.y,b.w,16),'Click to enter fullscreen mode:',FONT_BODY,1)
		const c=rect(b.x+b.w-80,b.y+b.h-20)
		ui_button(rect(c.x,c.y,80,20),'Fullscreen',1,_=>{toggle_fullscreen(),modal_exit(1)}),c.x-=65
		if(ui_button(rect(c.x,c.y,60,20),'Cancel',1)||ev.exit)modal_exit(0)
	}
	else if(ms.type=='brush'){
		const grid=rect(6,4), ss=25, gs=ss+4, m=5, lh=font_h(FONT_BODY), br=deck.brushes;grid.y+=ceil(count(br)/grid.x)
		const b=draw_modalbox(rect(m+(grid.x*gs)+m,m+(grid.y*gs)+lh+m))
		const lab=dr.brush>=(6*4)?ls(br.k[dr.brush-(6*4)]):'Choose a brush shape.'
		draw_textc(rect(b.x,b.y+b.h-lh,b.w,lh),lab,FONT_BODY,1)
		for(let z=0;z<grid.x*grid.y;z++){
			const s=rect(b.x+m+2+gs*(z%grid.x),b.y+m+2+gs*(0|(z/grid.x)),ss,ss)
			const c=rint(rect(s.x+s.w/2,s.y+s.h/2));draw_line(rpair(c,c),z,1,deck)
			if(z==dr.brush)draw_box(inset(s,-2),0,1)
			const a=dover(s)&&over(s), cs=(z==dr.brush&&ev.action), cl=cs||((ev.md||ev.drag)&&a), cr=cs||(ev.mu&&a)
			if(cl)draw_invert(pal,inset(s,-1)); if(cr){dr.brush=z,modal_exit(z);break}
		}
		if(ev.exit||(ev.mu&&!dover(b)&&!over(b)))modal_exit(-1),ev.mu=0
		if(ev.dir=='left' )dr.brush=((0|(dr.brush/grid.x))*grid.x)+((dr.brush+grid.x-1)%grid.x)
		if(ev.dir=='right')dr.brush=((0|(dr.brush/grid.x))*grid.x)+((dr.brush+       1)%grid.x)
		if(ev.dir=='up'   )dr.brush=(dr.brush+(grid.x*(grid.y-1)))%(grid.x*grid.y)
		if(ev.dir=='down' )dr.brush=(dr.brush+grid.x             )%(grid.x*grid.y)
		dr.brush=clamp(0,dr.brush,(6*4)+count(br)-1)
	}
	else if(ms.type=='pattern'||ms.type=='fill'){
		const grid=rect(8,dr.color?2:4), ss=25, gs=ss+4, m=5, lh=font_h(FONT_BODY)
		const getv=_=>ms.type=='pattern'?dr.pattern  :dr.fill
		const setv=x=>ms.type=='pattern'?dr.pattern=x:dr.fill=x
		const b=draw_modalbox(rect(m+(grid.x*gs)+m,m+(grid.y*gs)+lh+m)); let v=getv()
		draw_textc(rect(b.x,b.y+b.h-lh,b.w,lh),`Choose a ${ms.type=='fill'?'fill':'stroke'} ${dr.color?'color':'pattern'}.`,FONT_BODY,1)
		for(let z=0;z<grid.x*grid.y;z++){
			const s=rint(rect(b.x+m+2+gs*(z%grid.x),b.y+m+2+gs*(0|(z/grid.x)),ss,ss)), ci=!dr.color?z: z<2?z: 31+z
			draw_rect(s,ci); if(ci==v)draw_box(inset(s,-2),0,1)
			const a=dover(s)&&over(s), cs=(ci==v&&ev.action), cl=cs||((ev.md||ev.drag)&&a), cr=cs||(ev.mu&&a)
			if(cl)draw_invert(pal,inset(s,-1)); if(cr){setv(ci),modal_exit(ci);break}
		}
		if(ev.exit||(ev.mu&&!dover(b)&&!over(b)))modal_exit(-1),ev.mu=0
		if(ev.dir&&dr.color&&v>=2)v=v-31
		if(ev.dir=='left' )setv(((0|(v/grid.x))*grid.x)+((v+grid.x-1)%grid.x))
		if(ev.dir=='right')setv(((0|(v/grid.x))*grid.x)+((v+       1)%grid.x))
		if(ev.dir=='up'   )setv((v+(grid.x*(grid.y-1)))%(grid.x*grid.y))
		if(ev.dir=='down' )setv((v+grid.x             )%(grid.x*grid.y))
		if(ev.dir&&dr.color&&getv()>=2)setv(getv()+31)
	}
	else if(ms.type=='grid'){
		const b=draw_modalbox(rect(120,160))
		draw_textc(rect(b.x,b.y-5,b.w,20),'Grid Size',FONT_MENU,1)
		draw_text(rect(b.x,b.y+22,42,20),'Width' ,FONT_MENU,1)
		draw_text(rect(b.x,b.y+42,42,20),'Height',FONT_MENU,1)
		ui_field(rect(b.x+42,b.y+20,b.w-42,18),ms.name)
		ui_field(rect(b.x+42,b.y+40,b.w-42,18),ms.text)
		dr.grid_size.x=ln(rtext_string(ms.name.table)),dr.grid_size.x=0|max(1,dr.grid_size.x)
		dr.grid_size.y=ln(rtext_string(ms.text.table)),dr.grid_size.y=0|max(1,dr.grid_size.y)
		const zc=rect(b.x,b.y+70);draw_hline(b.x,b.x+b.w,zc.y-5,13)
		draw_textc(rect(zc.x,zc.y,b.w,20),'FatBits Scale',FONT_MENU,1),zc.y+=20
		if(ui_radio(rect(zc.x,zc.y,b.w,16),'2x',1,dr.zoom==2))dr.zoom=2;zc.y+=16
		if(ui_radio(rect(zc.x,zc.y,b.w,16),'4x',1,dr.zoom==4))dr.zoom=4;zc.y+=16
		if(ui_radio(rect(zc.x,zc.y,b.w,16),'8x',1,dr.zoom==8))dr.zoom=8;zc.y+=16
		const c=rect(b.x,b.y+b.h-20)
		if(ui_button(rect(b.x+b.w-60,c.y,60,20),'OK',1)||ev.exit)modal_exit(1)
	}
	else if(ms.type=='deck_props'){
		const b=draw_modalbox(rect(220,100))
		draw_textc(rect(b.x,b.y-5,b.w,20),'Deck Properties',FONT_MENU,1)
		draw_text(rect(b.x,b.y+22,42,20),'Name',FONT_MENU,1)
		draw_text(rect(b.x,b.y+42,42,20),'Author',FONT_MENU,1)
		ui_field(rect(b.x+42,b.y+20,b.w-42,18),ms.name)
		ui_field(rect(b.x+42,b.y+40,b.w-42,18),ms.text)
		iwrite(deck,lms('name'  ),rtext_string(ms.name.table))
		iwrite(deck,lms('author'),rtext_string(ms.text.table)),mark_dirty()
		const c=rect(b.x,b.y+b.h-20)
		if(ui_button(rect(c.x,c.y,60,20),'Script...',1))setscript(deck),modal_exit(0);c.x+=65
		if(ui_button(rect(c.x,c.y,60,20),'Protect...',1))modal_enter('save_locked')
		if(ui_button(rect(b.x+b.w-60,c.y,60,20),'OK',1)||ev.exit)modal_exit(1)
	}
	else if(ms.type=='card_props'){
		const b=draw_modalbox(rect(220,100)),card=ifield(deck,'card')
		draw_textc(rect(b.x,b.y-5,b.w,20),'Card Properties',FONT_MENU,1)
		draw_text(rect(b.x,b.y+22,42,20),'Name',FONT_MENU,1),ui_field(rect(b.x+42,b.y+20,b.w-42,18),ms.name)
		const c=rect(b.x,b.y+b.h-20)
		if(ui_button(rect(c.x,c.y,60,20),'Script...',1))setscript(card),modal_exit(0)
		if(ui_button(rect(b.x+b.w-60,c.y,60,20),'OK',1)||ev.exit)modal_exit(1)
	}
	else if(ms.type=='button_props'){
		const b=draw_modalbox(rect(220,170)),button=ob.sel[0]
		draw_textc(rect(b.x,b.y-5,b.w,20),'Button Properties',FONT_MENU,1)
		draw_text(rect(b.x,b.y+22,42,20),'Name',FONT_MENU,1)
		draw_text(rect(b.x,b.y+42,42,20),'Text',FONT_MENU,1)
		ui_field(rect(b.x+42,b.y+20,b.w-42,18),ms.name)
		ui_field(rect(b.x+42,b.y+40,b.w-42,18),ms.text)
		iwrite(button,lms('name'),rtext_string(ms.name.table))
		iwrite(button,lms('text'),rtext_string(ms.text.table))
		draw_text(rect(b.x+(0|(b.w/2)),b.y+72,54,20),'Shortcut',FONT_MENU,1)
		const s=normalize_shortcut(rtext_string(ms.form0.table));ms.form0.table=rtext_cast(lms(s))
		if(wid.fv==ms.form0)wid.cursor=rect(clamp(0,wid.cursor.x,s.length),clamp(0,wid.cursor.y,s.length))
		ui_field(rect(b.x+(0|(b.w/2))+54,b.y+70,(0|(b.w/2))-54,18),ms.form0)
		iwrite(button,lms('shortcut'),rtext_string(ms.form0.table))
		mark_dirty()
		const style=ls(ifield(button,'style')), sb=rect(b.x,b.y+70)
		if(ui_radio(rint(rect(sb.x,sb.y,b.w/2,16)),'Round'    ,1,style=='round'    )){iwrite(button,lms('style'),lms('round'    )),mark_dirty()}sb.y+=16
		if(ui_radio(rint(rect(sb.x,sb.y,b.w/2,16)),'Rectangle',1,style=='rect'     )){iwrite(button,lms('style'),lms('rect'     )),mark_dirty()}sb.y+=16
		if(ui_radio(rint(rect(sb.x,sb.y,b.w/2,16)),'Checkbox' ,1,style=='check'    )){iwrite(button,lms('style'),lms('check'    )),mark_dirty()}sb.y+=16
		if(ui_radio(rint(rect(sb.x,sb.y,b.w/2,16)),'Invisible',1,style=='invisible')){iwrite(button,lms('style'),lms('invisible')),mark_dirty()}sb.y+=16
		const c=rect(b.x,b.y+b.h-20)
		if(ui_button(rect(c.x,c.y,60,20),'Script...',1))setscript(button),modal_exit(0); c.x+=65
		if(ui_button(rect(c.x,c.y,60,20),'Action...',card_is(con())))modal_enter('action')
		if(ui_button(rect(b.x+b.w-60,c.y,60,20),'OK',1)||ev.exit)modal_exit(1)
	}
	else if(ms.type=='field_props'){
		const b=draw_modalbox(rect(260,200+60)),f=ob.sel[0], p=unpack_field(f)
		draw_textc(rect(b.x,b.y-5,b.w,20),'Field Properties',FONT_MENU,1)
		draw_text(rect(b.x,b.y+22,42,20),'Name',FONT_MENU,1)
		draw_text(rect(b.x,b.y+42,42,60),'Text',FONT_MENU,1)
		ui_field(rect(b.x+42,b.y+20,b.w-42,18),ms.name)
		const style=ls(ifield(f,'style'))
		widget_field(null,{size:rect(b.x+42,b.y+40,b.w-42,88),font:p.font,show:'solid',scrollbar:1,border:1,style,align:p.align,locked:0},ms.text)
		iwrite(f,lms('name' ),rtext_string(ms.name.table))
		iwrite(f,lms('value'),ms.text.table),mark_dirty()
		let border=lb(ifield(f,'border')), scrollbar=lb(ifield(f,"scrollbar")), cb=rect(b.x,b.y+80+60)
		if(ui_checkbox(rect(cb.x,cb.y,b.w,16),'Border'   ,1,border   )){border   ^=1,iwrite(f,lms('border'   ),lmn(border   )),mark_dirty()}cb.y+=16
		if(ui_checkbox(rect(cb.x,cb.y,b.w,16),'Scrollbar',1,scrollbar)){scrollbar^=1,iwrite(f,lms('scrollbar'),lmn(scrollbar)),mark_dirty()}cb.y+=16
		const sb=rect(b.x,cb.y+10);let cp=0
		if(ui_radio(rint(rect(sb.x,sb.y,b.w/2,16)),'Rich Text' ,1,style=='rich' )){iwrite(f,lms('style'),lms('rich' )),mark_dirty()     }sb.y+=16
		if(ui_radio(rint(rect(sb.x,sb.y,b.w/2,16)),'Plain Text',1,style=='plain')){iwrite(f,lms('style'),lms('plain')),mark_dirty(),cp=1}sb.y+=16
		if(ui_radio(rint(rect(sb.x,sb.y,b.w/2,16)),'Code'      ,1,style=='code' )){iwrite(f,lms('style'),lms('code' )),mark_dirty(),cp=1}sb.y+=16
		if(cp&&!rtext_is_plain(ms.text.table))ms.text.table=rtext_cast(rtext_string(ms.text.table))
		const align=ls(ifield(f,'align')), ab=rect(b.x+(b.w/2),cb.y+10)
		if(ui_radio(rint(rect(ab.x,ab.y,b.w/2,16)),'Align Left' ,1,align=='left'  )){iwrite(f,lms('align'),lms('left'  )),mark_dirty()}ab.y+=16
		if(ui_radio(rint(rect(ab.x,ab.y,b.w/2,16)),'Center'     ,1,align=='center')){iwrite(f,lms('align'),lms('center')),mark_dirty()}ab.y+=16
		if(ui_radio(rint(rect(ab.x,ab.y,b.w/2,16)),'Align Right',1,align=='right' )){iwrite(f,lms('align'),lms('right' )),mark_dirty()}ab.y+=16
		const c=rect(b.x,b.y+b.h-20)
		if(ui_button(rect(c.x,c.y,60,20),'Script...',1))setscript(f),modal_exit(0)
		if(ui_button(rect(b.x+b.w-60,c.y,60,20),'OK',1)||ev.exit)modal_exit(1)
	}
	else if(ms.type=='slider_props'){
		const b=draw_modalbox(rect(220,170)),f=ob.sel[0]
		draw_textc(rect(b.x,b.y-5,b.w,20),'Slider Properties',FONT_MENU,1)
		draw_text(rect(b.x,b.y+22,42,20),'Name'  ,FONT_MENU,1)
		draw_text(rect(b.x,b.y+42,42,20),'Format',FONT_MENU,1)
		ui_field(rect(b.x+50,b.y+20,b.w-50,18),ms.name)
		ui_field(rect(b.x+50,b.y+40,b.w-50,18),ms.text)
		iwrite(f,lms('name'  ),rtext_string(ms.name.table))
		iwrite(f,lms('format'),rtext_string(ms.text.table)),mark_dirty()
		const style=ls(ifield(f,'style')), sb=rect(b.x,b.y+70)
		if(ui_radio(rint(rect(sb.x,sb.y,b.w/2,16)),'Horizontal',1,style=='horiz'  )){iwrite(f,lms('style'),lms('horiz'  )),mark_dirty()}sb.y+=16
		if(ui_radio(rint(rect(sb.x,sb.y,b.w/2,16)),'Vertical'  ,1,style=='vert'   )){iwrite(f,lms('style'),lms('vert'   )),mark_dirty()}sb.y+=16
		if(ui_radio(rint(rect(sb.x,sb.y,b.w/2,16)),'Bar'       ,1,style=='bar'    )){iwrite(f,lms('style'),lms('bar'    )),mark_dirty()}sb.y+=16
		if(ui_radio(rint(rect(sb.x,sb.y,b.w/2,16)),'Compact'   ,1,style=='compact')){iwrite(f,lms('style'),lms('compact')),mark_dirty()}sb.y+=16
		const ib=rint(rect(b.x+b.w/2,b.y+70))
		draw_text(rect(ib.x+5,ib.y+2,40,20),'Min' ,FONT_MENU,1),ui_field(rint(rect(ib.x+40,ib.y,b.w/2-40,18)),ms.form0),ib.y+=20
		draw_text(rect(ib.x+5,ib.y+2,40,20),'Max' ,FONT_MENU,1),ui_field(rint(rect(ib.x+40,ib.y,b.w/2-40,18)),ms.form1),ib.y+=20
		draw_text(rect(ib.x+5,ib.y+2,40,20),'Step',FONT_MENU,1),ui_field(rint(rect(ib.x+40,ib.y,b.w/2-40,18)),ms.form2),ib.y+=20
		const c=rect(b.x,b.y+b.h-20)
		iwrite(f,lms('interval'),lml([rtext_string(ms.form0.table),rtext_string(ms.form1.table)]))
		iwrite(f,lms('step'),rtext_string(ms.form2.table)),mark_dirty()
		if(ui_button(rect(c.x,c.y,60,20),'Script...',1))setscript(f),modal_exit(0)
		if(ui_button(rect(b.x+b.w-60,c.y,60,20),'OK',1)||ev.exit)modal_exit(1)
	}
	else if(ms.type=='canvas_props'){
		const b=draw_modalbox(rect(220,141)),canvas=ob.sel[0]
		draw_textc(rect(b.x,b.y-5,b.w,20),'Canvas Properties',FONT_MENU,1)
		draw_text(rect(b.x,b.y+22,42,20),'Name' ,FONT_MENU,1)
		draw_text(rect(b.x,b.y+42,42,20),'Scale',FONT_MENU,1)
		ui_field(rect(b.x+42,b.y+20,b.w-42,18),ms.name)
		ui_field(rect(b.x+42,b.y+40,b.w-42,18),ms.text)
		iwrite(canvas,lms('name' ),rtext_string(ms.name.table))
		iwrite(canvas,lms('scale'),rtext_string(ms.text.table)),mark_dirty()
		let border=lb(ifield(canvas,'border')),draggable=lb(ifield(canvas,'draggable')),cb=rect(b.x,b.y+50+20)
		if(ui_checkbox(rect(cb.x,cb.y,b.w,16),'Border'   ,1,border   ))border   ^=1,iwrite(canvas,lms('border'   ),lmn(border   )),mark_dirty();cb.y+=16
		if(ui_checkbox(rect(cb.x,cb.y,b.w,16),'Draggable',1,draggable))draggable^=1,iwrite(canvas,lms('draggable'),lmn(draggable)),mark_dirty()
		const c=rect(b.x,b.y+b.h-20)
		if(ui_button(rect(c.x,c.y,60,20),'Script...',1))setscript(canvas),modal_exit(0)
		if(ui_button(rect(b.x+b.w-60,c.y,60,20),'OK',1)||ev.exit)modal_exit(1)
	}
	else if(ms.type=='grid_props'){
		const b=draw_modalbox(rect(280,216+70)),grid=ob.sel[0]
		draw_textc(rect(b.x,b.y-5,b.w,20),'Grid Properties',FONT_MENU,1)
		draw_text(rect(b.x,b.y+22,47,20),'Name'  ,FONT_MENU,1)
		draw_text(rect(b.x,b.y+42,47,20),'Format',FONT_MENU,1)
		draw_text(rect(b.x,b.y+62,47,20),'Value' ,FONT_MENU,1)
		ui_field   (rect(b.x+47,b.y+20,b.w-47,18),ms.name)
		ui_field   (rect(b.x+47,b.y+40,b.w-47,18),ms.text)
		ui_codeedit(rect(b.x+47,b.y+60,b.w-47,118),1,ms.form0)
		const etext=rtext_string(ms.form0.table),format=rtext_string(ms.text.table),val=table_decode(etext,format),cn=tab_cols(val).length,rn=count(val)
		draw_text(rect(b.x+47,b.y+120+60,b.w-47,18),`${cn} column${cn==1?'':'s'}, ${rn} row${rn==1?'':'s'}.`,FONT_BODY,1)
		iwrite(grid,lms('name'  ),rtext_string(ms.name.table))
		iwrite(grid,lms('format'),format),mark_dirty()
		let headers=lb(ifield(grid,'headers')), scrollbar=lb(ifield(grid,'scrollbar')), lines=lb(ifield(grid,'lines')), bycell=lb(ifield(grid,'bycell'))
		let cb=rect(b.x,b.y+130+70)
		if(ui_checkbox(rint(rect(cb.x,cb.y,b.w/2,16)),'Column Headers',1,headers  )){headers  ^=1,iwrite(grid,lms('headers'  ),lmn(headers  )),mark_dirty()}cb.y+=16
		if(ui_checkbox(rint(rect(cb.x,cb.y,b.w/2,16)),'Scrollbar'     ,1,scrollbar)){scrollbar^=1,iwrite(grid,lms('scrollbar'),lmn(scrollbar)),mark_dirty()}cb.y+=16
		if(ui_checkbox(rint(rect(cb.x,cb.y,b.w/2,16)),'Grid Lines'    ,1,lines    )){lines    ^=1,iwrite(grid,lms('lines'    ),lmn(lines    )),mark_dirty()}cb.y+=16
		if(ui_checkbox(rint(rect(cb.x,cb.y,b.w/2,16)),'Select by Cell',1,bycell   )){bycell   ^=1,iwrite(grid,lms('bycell'   ),lmn(bycell   )),mark_dirty()}cb.y+=16
		const eb=rint(rect(b.x+(b.w/2),b.y+130+70))
		if(ui_radio(rint(rect(eb.x,eb.y,b.w/2,16)),'Edit as JSON',1,ms.edit_json==1)){ms.form0=fieldstr(lms(fjson(monad.cols(val)))),ms.edit_json=1}eb.y+=16
		if(ui_radio(rint(rect(eb.x,eb.y,b.w/2,16)),'Edit as CSV' ,1,ms.edit_json==0))ms.form0=fieldstr(n_writecsv(count(format)?[val,format]:[val])),ms.edit_json=0
		const c=rect(b.x,b.y+b.h-20), w=ll(ifield(grid,'widths'))
		if(ui_button(rect(c.x,c.y,60,20),'Script...',1))modal_exit(0),setscript(grid);c.x+=65
		if(ui_button(rect(c.x,c.y,90,20),'Reset Widths',w.length))iwrite(grid,lms('widths'),lml([])),mark_dirty()
		if(ui_button(rect(b.x+b.w-60,c.y,60,20),'OK',1)||ev.exit)modal_exit(1)
	}
	else if(ms.type=='action'){
		const b=draw_modalbox(rect(220,190))
		draw_textc(rect(b.x,b.y-5,b.w,20),'Button Action',FONT_MENU,1)
		const c=rect(b.x+b.w-60,b.y+b.h-20), cr=rect(b.x,b.y+36)
		const ready=(ms.act_go||ms.act_sound)&&(ms.act_go?(ms.act_gomode!=5||count(ms.verb)):1)&&(ms.act_sound?count(ms.message):1)
		if(ui_button(rect(c.x,c.y,60,20),'OK',ready))modal_exit(1);c.x-=65
		if(ui_button(rect(c.x,c.y,60,20),'Cancel',1)||ev.exit)modal_exit(0)
		if(ui_checkbox(rint(rect(b.x,b.y+20,b.w/2,16)),'Go to Card',1,ms.act_go))ms.act_go^=1
		if(ui_radio(rect(cr.x+5,cr.y,80,16),'First'   ,ms.act_go,ms.act_gomode==0))ms.act_gomode=0;cr.y+=16
		if(ui_radio(rect(cr.x+5,cr.y,80,16),'Previous',ms.act_go,ms.act_gomode==1))ms.act_gomode=1;cr.y+=16
		if(ui_radio(rect(cr.x+5,cr.y,80,16),'Next'    ,ms.act_go,ms.act_gomode==2))ms.act_gomode=2;cr.y+=16
		if(ui_radio(rect(cr.x+5,cr.y,80,16),'Last'    ,ms.act_go,ms.act_gomode==3))ms.act_gomode=3;cr.y+=16
		if(ui_radio(rect(cr.x+5,cr.y,80,16),'Back'    ,ms.act_go,ms.act_gomode==4))ms.act_gomode=4;cr.y+=16
		if(ui_radio(rect(cr.x+5,cr.y,45,16),'Pick:'   ,ms.act_go,ms.act_gomode==5))ms.act_gomode=5
		if(ms.act_go&&ms.act_gomode==5){
			const l=rect(cr.x+5+45,cr.y,b.w-5-45-5-60,16)
			draw_hline(l.x,l.x+l.w,l.y+l.h,13),draw_text_fit(inset(l,1),ls(ms.verb),FONT_BODY,1)
			if(ui_button(rect(b.x+b.w-60,cr.y,60,20),'Choose...',ms.act_go&&ms.act_gomode==5))modal_push('pick_card')
		}cr.y+=26;
		if(ui_checkbox(rect(cr.x,cr.y,80,16),'Play a Sound',1,ms.act_sound))ms.act_sound^=1
		if(ms.act_go){
			if(ui_checkbox(rint(rect(b.x+b.w/2,b.y+20,b.w/2-19,16)),'With Transition',1,ms.act_trans))ms.act_trans^=1
			if(ms.act_trans){
				const gd=rint(rect(b.x+b.w/2,b.y+36,b.w/2,70))
				if(ms.grid.scroll==-99){ms.grid.scroll=grid_scrollto(ms.grid.table,{size:gd,font:FONT_BODY,headers:0},-1,ms.grid.row)}
				ui_list(gd,ms.grid)
				const pv=rpair(rect(b.x+b.w-17,b.y+20),ms.canvas.size), pi=image_make(ms.canvas.size)
				ms.trans=dget(deck.transit,tab_cell(ms.grid.table,'value',ms.grid.row))
				do_transition((frame_count%60)/60.0,pi,0),draw_scaled(pv,pi,1),draw_box(pv,0,1)
			}
		}
		if(ms.act_sound){
			const l=rect(cr.x+5+75,cr.y,b.w-5-75-5-60,16)
			draw_hline(l.x,l.x+l.w,l.y+l.h,13),draw_text_fit(inset(l,1),ls(ms.message),FONT_BODY,1)
			if(ui_button(rect(b.x+b.w-60,cr.y,60,20),'Choose...',ms.act_sound)){
				ms.act_transno=ms.grid.row,ms.grid=gridtab(sounds_enumerate()),ms.from_action=1,ms.type='sounds'
			}
		}
	}
	else if(ms.type=='pick_card'){
		const b=draw_modalbox(rect(220,45))
		draw_textc(rect(b.x,b.y,b.w,16),'Pick a card- any card.',FONT_BODY,1)
		const c=rint(rect(b.x+(b.w-60-5-60-5-60)/2,b.y+b.h-20))
		if(ui_button(rect(c.x,c.y,60,20),'Previous',1)||ev.dir=='left')n_go([lms('Prev')],deck);c.x+=65
		if(ui_button(rect(c.x,c.y,60,20),'Choose',1)){
			const name=ifield(ifield(deck,'card'),'name')
			n_go([lmn(ms.act_card)],deck)
			if(ms.carda.length)ob.sel=ms.carda
			modal_pop(0)
			if(ms.type=='action')ms.verb=name
			if(ms.type=='link')ms.text=fieldstr(name)
		}c.x+=65
		if(ui_button(rect(c.x,c.y,60,20),'Next',1)||ev.dir=='right')n_go([lms('Next')],deck)
	}
	else if(ms.type=='trans'){
		const now=new Date().getTime()/1000
		const sofar=ms.time_start==-1?0:now-ms.time_start;if(ms.time_start==-1)ms.time_start=now
		if(do_transition(min((sofar*60)/ms.time_end,1.0),frame.image,1)>=1||do_panic)modal_exit(0)
	}
	ms.in_modal=0
}
export const n_open=([type,hint])=>{
	modal_enter('open_lil');let t=type?ls(type):'',r=lms('');ms.filter=''
	if(t=='array')r=array_make(0,'u8',0)
	if(t=='sound')ms.filter='audio/*',r=sound_make(new Uint8Array(0))
	if(t=='image')ms.filter='image/*',r=image_make(rect())
	if(t=='text')ms.filter='.csv,.txt'
	if(image_is(r)&&hint&&(ls(hint)=='frames'||ls(hint)=='gray_frames'))r=readgif([],ls(hint))
	ms.verb=t=='array'?lms(t): hint?ls(hint):'';return r
}
export const n_save=([x,s])=>{
	modal_enter('save_lil');x=x||NONE;ms.path_suffix=array_is(x)&&s?ls(s):''
	if(array_is(x)                                      )ms.desc='Save a binary file.'    ,ms.text=fieldstr(lms('untitled'+ms.path_suffix))
	if(sound_is(x)                                      )ms.desc='Save a .wav sound file.',ms.text=fieldstr(lms('sound.wav'))
	if(image_is(x)||lid(x)||(lil(x)&&x.v.some(image_is)))ms.desc='Save a .gif image file.',ms.text=fieldstr(lms('image.gif'))
	ms.verb=x;return NONE
}
export const n_alert=([t,p,x,y])=>{
	if(ls(p)=='bool'){modal_enter('confirm_lil'),ms.verb=x?lms(ls(x)):null}
	else if(ls(p)=='string'){modal_enter('input_lil');if(x)ms.text=fieldstr(x)}
	else if(ls(p)=='choose'){
		modal_enter('choose_lil')
		ms.verb=!x?ld(NONE): lil(x)?dyad.dict(x,x): ld(x); if(count(ms.verb)<1)ms.verb=ld(monad.list(NONE))
		ms.grid=gridtab(lt(monad.keys(ms.verb)), y?dvix(ms.verb,y):-1)
	}else{modal_enter('alert_lil')}
	ms.message=plain_or_rich(t);return NONE
}
export const free_canvas=deck=>{ // make a drawing surface that isn't attached to the parent deck, but is aware of its resources:
	const d=deck_read('{deck}\n{card:home}\n{widgets}\nc:{"type":"canvas"}')
	const c=d.cards.v[0], r=c.widgets.v[0]
	iwrite(r,lms('size'),lmpair(deck.size)),d.fonts=deck.fonts,d.patterns=deck.patterns,r.free=1
	container_image(r,1);return r
}
export const go_notify=(deck,x,t,url,delay)=>{
	if(url&&/^(http|https|ftp|gopher|gemini):\/\//.test(url)){modal_enter('url'),ms.text=fieldstr(lms(url));return}
	const moved=x!=ln(ifield(ifield(deck,'card'),'index'))
	if(moved){con_set(null);if(uimode=='script')close_script()}
	if(moved&&!deck.locked&&x>=0){try{
		const name=ls(ifield(deck.cards.v[x],'name'))
		history.replaceState(undefined,undefined,'#'+name)
	}catch(e){}}
	const tfun=t==null?null: lion(t)?t: dget(deck.transit,t)
	if(ms.type!='trans'&&x>=0&&tfun){
		modal_enter('trans'),ms.time_curr=0,ms.time_end=delay==null?30:0|max(1,ln(delay)),ms.time_start=-1;
		ms.trans=tfun, ms.canvas=free_canvas(deck)
		ms.carda=draw_con(ifield(deck,'card')), ms.cardb=draw_con(ifield(deck,'cards').v[x])
	}
	if(moved&&uimode=='interact')msg.pending_loop=1
	if(moved||t){
		grid_exit(),field_exit(),bg_end_selection(),bg_end_lasso(),ob.sel=[],wid.active=ms.type=='listen'?0:-1,mark_dirty()
	}
	if(uimode=='interact')msg.next_view=1
}
let field_notify_disable=0
export const field_notify=(field)=>{
	if(field_notify_disable||!wid.infield||wid.ft!=field)return
	const v=ifield(field,'value');if(rtext_len(v))return
	wid.fv={table:v,scroll:0}
	wid.cursor=rect(),wid.field_dirty=0
	wid.hist=[],wid.hist_cursor=0
	if(enable_touch){field_exit(),wid.active=-1}
}

// Keycaps

export const KS=(v,l,w)=>({v,l,w}), K=v=>KS(v,v,1)
const LCAPS=[
	[K('`'),K('1'),K('2'),K('3'),K('4'),K('5'),K('6'),K('7'),K('8'),K('9'),K('0'),K('-'),K('='),KS('Backspace','delete',1.5)],
	[KS('Tab','tab',1.5),K('q'),K('w'),K('e'),K('r'),K('t'),K('y'),K('u'),K('i'),K('o'),K('p'),K('['),K(']'),K('\\')],
	[KS('CapsLock','capslock',2),K('a'),K('s'),K('d'),K('f'),K('g'),K('h'),K('j'),K('k'),K('l'),K(';'),K('\''),KS('Enter','return',2)],
	[KS('Shift','shift',2.5),K('z'),K('x'),K('c'),K('v'),K('b'),K('n'),K('m'),K(','),K('.'),K('/'),KS('Shift','shift',2.5)],
	[KS('ArrowLeft','',1),KS('ArrowDown','',1),KS('ArrowUp','',1),KS('ArrowRight','',1),KS(null,'',1),KS(' ',' ',5),KS(null,'',1),KS(-2,'',2),KS(-1,'OK',2)],
]
const UCAPS=[
	[K('~'),K('!'),K('@'),K('#'),K('$'),K('%'),K('^'),K('&'),K('*'),K('('),K(')'),K('_'),K('+'),KS('Backspace','delete',1.5)],
	[KS('Tab','tab',1.5),K('Q'),K('W'),K('E'),K('R'),K('T'),K('Y'),K('U'),K('I'),K('O'),K('P'),K('{'),K('}'),K('|')],
	[KS('CapsLock','capslock',2),K('A'),K('S'),K('D'),K('F'),K('G'),K('H'),K('J'),K('K'),K('L'),K(':'),K('"'),KS('Enter','return',2)],
	[KS('Shift','shift',2.5),K('Z'),K('X'),K('C'),K('V'),K('B'),K('N'),K('M'),K('<'),K('>'),K('?'),KS('Shift','shift',2.5)],
	[KS('ArrowLeft','',1),KS('ArrowDown','',1),KS('ArrowUp','',1),KS('ArrowRight','',1),KS(null,'',1),KS(' ',' ',5),KS(null,'',1),KS(-2,'',2),KS(-1,'OK',2)],
]
export const soft_keyboard=r=>{
	let ex=0, el=0, y=r.y, kh=0|(r.h/LCAPS.length), sh=ev.shift^kc.lock^kc.shift, pal=deck.patterns.pal.pix
	for(let row=0;row<LCAPS.length;row++){
		const w=LCAPS[row].reduce((a,x)=>a+x.w,0), keys=(sh?UCAPS:LCAPS)[row]; let x=0
		keys.forEach((k,i,arr)=>{
			let b=rint(rect(r.x+x+1,y,i==arr.length-1?(r.w-x):(k.w*(r.w/w)),kh+1));x+=b.w-1
			draw_box(b,0,1)
			const e=k.v==-2&&wid.f.style=='code'&&uimode=='interact'
			if     (k.v=='ArrowLeft' )draw_iconc(b,ARROWS[4],1)
			else if(k.v=='ArrowDown' )draw_iconc(b,ARROWS[1],1)
			else if(k.v=='ArrowUp'   )draw_iconc(b,ARROWS[0],1)
			else if(k.v=='ArrowRight')draw_iconc(b,ARROWS[5],1)
			else                      draw_textc(b,e?'run':k.l,FONT_MENU,1)
			let kd=keydown[k.v];b=inset(b,2)
			const a=dover(b)&&over(inset(b,-4))&&ev.down_modal==ms.type&&ev.down_uimode==uimode&&ev.down_caps==1;if(k.v&&a&&(ev.md||ev.drag))kd=1
			if(k.v==-1){draw_box(b,0,13);if(ev.mu&&a)ex=1}
			else if(e){if(ev.mu&a)el=1}
			else if(k.v=='Shift'   ){if(ev.mu&&a)kc.shift^=1;if(kc.shift)kd=1}
			else if(k.v=='CapsLock'){if(ev.mu&&a)kc.lock^=1;if(kc.lock)kd=1}
			else if(ev.mu&&a&&k.v){if(k.v.length==1){field_input(k.v)}else{field_keys(k.v,sh)};kc.shift=0}
			if(kd)draw_invert(pal,b)
		});y+=kh
	}return {exit:ex,eval:el}
}
export const keycaps=_=>{
	if(!enable_touch||!wid.fv)kc.on=0;if(!kc.on)return
	frame.image.pix.fill(32)
	const mh=3+font_h(FONT_MENU)
	const r=rect(0,mh,frame.size.x+1,0|((frame.size.y/2)-mh))
	if(kc.heading){const s=font_textsize(FONT_MENU,kc.heading);const h=rect(r.x,r.y,r.w,s.y+5);draw_textc(h,kc.heading,FONT_MENU,1),r.h-=h.h,r.y+=h.h}
	if(ms.type)ms.in_modal=1
	if(uimode=='script'){script_editor(r)}
	else if(ms.type=='listen'){const c=frame.clip;frame.clip=rect(r.x,r.y,r.w,r.h+6);wid.count=0,listener(r),frame.clip=c}
	else{
		wid.count=wid.active
		widget_field(wid.ft,{size:inset(r,5),font:wid.f.font,show:'solid',scrollbar:1,border:1,style:wid.f.style,align:wid.f.align,locked:0},wid.fv)
		ms.in_modal=0
	}
	const modes=soft_keyboard(inset(rect(r.x,r.y+r.h+1,r.w-2,frame.size.y-(r.y+r.h)),5))
	if(ms.type=='listen'&&(modes.eval||ev.eval))listener_eval()
	if(ms.type!='listen'&&(modes.eval||ev.eval))field_keys('Enter',1)
	if(modes.exit||ev.exit){
		field_exit();wid.active=-1
		if(uimode=='script')close_script()
		if(ms.type=='gridcell')modal_exit(1)
		if(ms.type=='link'    )modal_pop(1)
		if(ms.type=='listen'  )modal_exit(0)
	}
}

// General Purpose Edit History

let doc_hist=[], doc_hist_cursor=0
export const has_undo=_=>doc_hist_cursor>0
export const has_redo=_=>doc_hist_cursor<doc_hist.length
export const undo=_=>{const x=doc_hist[--(doc_hist_cursor)];apply(0,x)}
export const redo=_=>{const x=doc_hist[(doc_hist_cursor)++];apply(1,x)}
export const edit=x=>{doc_hist=doc_hist.slice(0,doc_hist_cursor),doc_hist.push(x),redo()}
export const edit_target=r=>{
	const c=con()
	if(card_is     (c))r.card=ln(ifield(c,'index'))
	if(prototype_is(c))r.def=ifield(c,'name')
	return r
}
export const apply=(fwd,x)=>{
	let container=null, t=x.type
	if(x.def){con_set(container=dget(deck.contraptions,x.def))}
	else if(x.card!=undefined){
		let c=ifield(deck,'card')
		if(ln(ifield(c,'index'))!=x.card)n_go([lmn(x.card)],deck),c=ifield(deck,'card')
		con_set(null),container=c
	}
	if(!container)return
	const wids=con_wids()
	if(t=='ob_create'){fwd=!fwd,t='ob_destroy'}
	if(t=='bg_block'){
		if(uimode!='draw')setmode('draw')
		const r=x.pos, p=x[fwd?'after':'before']
		let bg=container_image(container,1), s=bg.size
		const cs=getpair(ifield(container,'size'))
		if(s.x!=cs.x||s.y!=cs.y){bg=image_resize(bg,cs),iwrite(container,lms('image'),bg),s=cs}
		const cb=x.clr_before, ca=x.clr_after, clip=rect(0,0,s.x,s.y)
		if(fwd&&ca)image_paste(x.clr_pos,clip,ca,bg,1)
		image_paste(r,clip,p,bg,1)
		if(!fwd&&cb)image_paste(x.clr_pos,clip,cb,bg,1)
	}
	else if(t=='ob_props'){
		if(uimode!='object')setmode('object')
		const p=x[fwd?'after':'before']
		Object.keys(p).map(k=>{const d=p[k], w=dget(wids,lms(k));if(w)Object.keys(d).map(i=>iwrite(w,lms(i),d[i]))})
	}
	else if(t=='ob_destroy'){
		if(uimode!='object')setmode('object')
		ob.sel=[]
		if(fwd){
			const w=x.props.map(z=>dget(wids,dget(z,lms('name')))).filter(x=>x!=null)
			x.props=con_copy_raw(container,w),w.map(z=>card_remove(container,z))
		}
		else{
			const w=con_paste_raw(container,x.props);w.map((z,i)=>{
				dset(x.props[i],lms('name'),ifield(z,'name')),ob.sel.push(z)
				if(!dget(x.props[i],lms('pos')))iwrite(z,lms('pos'),lmpair(rcenter(con_dim(),getpair(ifield(z,'size')))))
			})
		}
	}
	else if(t=='proto_props'){
		const v=x[fwd?'after':'before'];x.keys.map((k,i)=>iwrite(container,k,v[i]))
	}mark_dirty()
}

// Draw Mode

export const image_overlay=(dst,src,mask,offset)=>{
	const sd=dst.size, ss=src.size, d=rect(0,0,sd.x,sd.y);for(let b=0;b<ss.y;b++)for(let a=0;a<ss.x;a++){
		const c=src.pix[a+b*ss.x], p=rect(a+offset.x,b+offset.y);if(c!=mask&&rin(d,p))dst.pix[p.x+p.y*sd.x]=c
	}
}
export const image_mask=(src,mask)=>{const r=image_copy(src);for(let z=0;z<mask.pix.length;z++)if(!mask.pix[z])r.pix[z]=0;return r}
export const bg_scratch_clear=_=>dr.scratch.pix.fill(BG_MASK)
export const bg_scratch_under=_=>{if(dr.scratch&&dr.under){const b=con_image();for(let z=0;z<b.pix.length;z++)if(b.pix[z]==1)dr.scratch.pix[z]=BG_MASK}}
export const bg_scratch=_=>{
	const c=con_size();if(!dr.scratch)dr.scratch=image_make(c)
	const s=dr.scratch.size;if(s.x!=c.x||s.y!=c.y)dr.scratch=image_make(c)
	bg_scratch_clear()
}
export const bg_edit=_=>{
	const d=find_occupied(dr.scratch,BG_MASK)
	const back=con_image(),after=image_copy(back,d);image_overlay(after,image_copy(dr.scratch,d),BG_MASK,rect(0,0))
	edit(edit_target({type:'bg_block',pos:d,before:image_copy(back,d),after}))
}
export const draw_limbo=(clip,scale)=>{
	clip=rnorm(clip);if(!dr.limbo){/*nothing*/}
	else if(scale&&dr.limbo_dither){draw_rect      (clip,21)}
	else if(scale                 ){draw_fat_scaled(screen_to_con(clip),dr.limbo,!dr.trans,deck.patterns.pal.pix,frame_count,dr.zoom,con_to_screen(rect(0,0)))}
	else if(       dr.limbo_dither){draw_dithered  (clip,dr.limbo,!dr.trans,dr.omask,dr.dither_threshold)}
	else                           {draw_scaled    (clip,dr.limbo,!dr.trans)}
}
export const bg_scaled_limbo=_=>{
	const d=dr.sel_here, back=con_image()
	const r=dr.trans||dr.omask?image_copy(back,d):image_make(rect(d.w,d.h)), s=r.size, t=frame;frame=draw_frame(r)
	if(dr.trans){const c=dr.sel_start;draw_rect(rect(c.x-d.x,c.y-d.y,c.w,c.h),dr.fill)}
	draw_limbo(frame.clip,0),frame=t;return r
}
export const bg_edit_sel=_=>{
	if(!dr.limbo)return
	const d=rcopy(dr.sel_here), back=con_image()
	const r={type:'bg_block',pos:d,before:image_copy(back,d),after:bg_scaled_limbo()}
	dr.limbo=null,dr.limbo_dither=0
	if(dr.sel_start.w>0||dr.sel_start.h>0){
		const after=image_make(rect(dr.sel_start.w,dr.sel_start.h));for(let z=0;z<after.pix.length;z++)after.pix[z]=dr.fill
		r.clr_pos=rcopy(dr.sel_start), r.clr_before=image_copy(back,dr.sel_start), r.clr_after=after, dr.sel_start=rect()
	}edit(edit_target(r))
}
export const bg_copy_selection=s=>image_copy(container_image(con(),1),s)
export const bg_scoop_selection=_=>{if(dr.limbo)return;dr.sel_start=rcopy(dr.sel_here);dr.limbo=bg_copy_selection(dr.sel_start),dr.limbo_dither=0}
export const bg_draw_lasso=(r,o,show_ants,fill)=>{
	if(dr.omask){
		const s=dr.omask.size
		for(let a=0;a<s.y;a++)for(let b=0;b<s.x;b++){const h=rect(b+o.x,a+o.y);if(inclip(h)&&dr.omask.pix[b+a*s.x])pix(h,fill)}
	}
	if(dr.mask){
		const s=dr.mask.size, ls=dr.limbo.size
		for(let a=0;a<s.y;a++)for(let b=0;b<s.x;b++){const h=rect(b+r.x,a+r.y);if(inclip(h)&&dr.mask.pix[b+a*s.x]){
			const c=show_ants&&ANTS==(0xFF&dr.mask.pix[b+a*s.x]),p=c?ANTS:dr.limbo.pix[b+a*ls.x];if(p||!dr.trans)pix(h,p)
		}}
	}
}
export const bg_lasso_preview=_=>{
	if(!bg_has_lasso())return
	const d=rsub(ev.pos,ev.dpos), dh=rect(dr.sel_here.x+d.x,dr.sel_here.y+d.y,dr.sel_here.w,dr.sel_here.h)
	const dd=rsub(ev.pos,dh), insel=dr.mask!=null&&rin(dh,ev.pos)&&dr.mask.pix[dd.x+dd.y*dh.w], r=ev.drag&&insel?dh:dr.sel_here, origin=con_to_screen(rect(0,0))
	if(!dr.fatbits){bg_draw_lasso(con_to_screen(r),con_to_screen(dr.sel_start),1,dr.fill);return}
	const o=dr.sel_start, anim=deck.patterns.anim, pal=deck.patterns.pal.pix
	const anim_pattern=(pix,x,y)=>pix<28||pix>31?pix: anim[pix-28][(0|(frame_count/4))%max(1,anim[pix-28].length)]
	const draw_pattern=(pix,x,y)=>pix<2?(pix?1:0): pix>31?(pix==32?0:1): pal_pat(pal,pix,x,y)&1
	for(let a=0;a<r.h;a++)for(let b=0;b<r.w;b++){
		if(!dr.omask.pix[b+a*dr.omask.size.x])continue
		draw_rect(radd(rmul(rect(b+o.x,a+o.y,1,1),dr.zoom),origin),dr.fill)
	}
	for(let a=0;a<r.h;a++)for(let b=0;b<r.w;b++){
		if(!dr.mask.pix[b+a*r.w])continue
		const v=dr.limbo.pix[b+a*r.w],c=anim_pattern(v,r.x+b,r.y+a),pat=draw_pattern(c,r.x+b,r.y+a)
		if(c||!dr.trans)draw_rect(radd(rmul(rect(b+r.x,a+r.y,1,1),dr.zoom),origin),c>=32?c: c==0?c: pat?1:32)
	}
	for(let a=0;a<r.h;a++)for(let b=0;b<r.w;b++){
		if((0xFF&dr.mask.pix[b+a*r.w])!=ANTS)continue
		const p=radd(rmul(rect(b+r.x,a+r.y),dr.zoom),origin)
		if(b<=    0||!dr.mask.pix[(b-1)+a*r.w])draw_vline(p.x              ,p.y,p.y+dr.zoom-1,ANTS)
		if(b>=r.w-1||!dr.mask.pix[(b+1)+a*r.w])draw_vline(p.x    +dr.zoom-1,p.y,p.y+dr.zoom-1,ANTS)
		if(a<=    0||!dr.mask.pix[b+(a-1)*r.w])draw_hline(p.x,p.x+dr.zoom-1,p.y              ,ANTS)
		if(a>=r.h-1||!dr.mask.pix[b+(a+1)*r.w])draw_hline(p.x,p.x+dr.zoom-1,p.y    +dr.zoom-1,ANTS)
	}
}
export const bg_tools=_=>{
	const bg_cancel=_=>{bg_scratch(),dr.poly=[]}
	if     (!dr.fatbits&&ev.mu&&ev.alt){dr.fatbits=1,center_fatbits(ev.pos),bg_cancel();return}
	else if( dr.fatbits&&ev.mu&&ev.alt){dr.fatbits=0,bg_cancel();return}if(ev.alt)return
	if(ev.md)pointer.prev=ev.pos
	if(!dover(con_view_dim()))ev.md=ev.mu=ev.drag=0
	if(dr.tool=='pencil'||dr.tool=='line'||dr.tool=='rect'||dr.tool=='fillrect'||dr.tool=='ellipse'||dr.tool=='fillellipse'){
		let clear=0;if(!dr.scratch)bg_scratch()
		if(ev.md){bg_scratch(),dr.erasing=ev.rdown||ev.shift}
		else if(ev.mu||ev.drag){
			const t=frame;frame=draw_frame(dr.scratch)
			if(dr.tool=='pencil'||dr.erasing){
				draw_line(rpair(pointer.prev,ev.pos),dr.brush,dr.erasing?0:bg_pat(),deck)
			}
			else if(dr.tool=='line'){
				let b=rcopy(snap(ev.dpos)),t=rcopy(snap(ev.pos));if(ev.shift){ // snap to isometric angles
					const d=rsub(t,b);t=b
					if     (Math.abs(d.x)*4<Math.abs(d.y)){t.y+=d.y;}
					else if(Math.abs(d.y)*4<Math.abs(d.x)){t.x+=d.x;}
					else if(Math.abs(d.x)*2<Math.abs(d.y)){t.x+=sign(d.x)*Math.abs(d.y)/2,t.y+=d.y}
					else if(Math.abs(d.y)*2<Math.abs(d.x)){t.y+=sign(d.y)*Math.abs(d.x)/2,t.x+=d.x}
					else {t.x+=sign(d.x)*Math.abs(max(d.x,d.y)),t.y+=sign(d.y)*Math.abs(max(d.x,d.y))}
				}bg_scratch_clear(),draw_line(rpair(rint(b),rint(t)),dr.brush,bg_pat(),deck)
			}
			else if(dr.tool=='rect'||dr.tool=='fillrect'){
				const b=snap(ev.dpos),a=snap(ev.pos),t=rsub(a,b);if(ev.shift){t.x=t.y=max(t.x,t.y)} // snap to square
				bg_scratch_clear();const r=rnorm(rpair(b,t));r.w++,r.h++
				if(dr.tool=='fillrect')draw_rect(r,bg_fill());draw_boxf(r,dr.brush,bg_pat(),deck)
			}
			else if(dr.tool=='ellipse'||dr.tool=='fillellipse'){
				const b=snap(ev.dpos),a=snap(ev.pos),t=rsub(a,b);if(ev.shift){t.x=t.y=max(t.x,t.y)} // snap to circle
				bg_scratch_clear();const r=rnorm(rpair(radd(b,rect(1,1)),t));r.w--,r.h--
				const c=rect(r.x+(r.w/2.0),r.y+(r.h/2.0)), divs=100, poly=range(divs).map(z=>{
					const a=z*(2*Math.PI)/divs;return rint(rect(c.x+(0.5+r.w/2.0)*Math.cos(a),c.y+(0.5+r.h/2.0)*Math.sin(a)))
				});poly.push(poly[0])
				if(dr.tool=='fillellipse')draw_poly(poly,bg_fill());draw_lines(poly,dr.brush,bg_pat(),deck)
			}
			bg_scratch_under(),frame=t;if(ev.mu)bg_edit(),clear=1
		}
		if(dr.scratch){
			if(dr.fatbits){draw_fat(con_clip(),dr.scratch,deck.patterns.pal.pix,frame_count,BG_MASK,dr.zoom,dr.offset)}
			else{image_overlay(frame.image,dr.scratch,BG_MASK,con_offset());}
		}
		if(clear)bg_scratch_clear()
	}
	if(dr.tool=='lasso'){
		const d=rect(ev.pos.x-ev.dpos.x,ev.pos.y-ev.dpos.y)
		const dh=rect(dr.sel_here.x+d.x,dr.sel_here.y+d.y,dr.sel_here.w,dr.sel_here.h)
		const dd=rect(ev.pos.x-dh.x,ev.pos.y-dh.y), insel=dr.mask!=null&&over(dh)&&dr.mask.pix[dd.x+dd.y*dh.w]
		if(ev.md&&!insel){bg_lasso_preview(),bg_end_lasso(),dr.poly.push(rcopy(ev.dpos))}
		else if(ev.drag&&!insel&&dr.poly.length>0){const l=last(dr.poly);if(ev.pos.x!=l.x||ev.pos.y!=l.y)dr.poly.push(rcopy(ev.pos))}
		else if(ev.mu&&insel){dr.sel_here=radd(dr.sel_here,d)}
		else if(ev.mu){
			const r=poly_bounds(dr.poly);if(r.w>1&&r.h>1){
				dr.mask=image_make(rect(r.w,r.h))
				const t=frame;frame=draw_frame(dr.mask)
				for(let a=0;a<r.h;a++)for(let b=0;b<r.w;b++)if(poly_in(dr.poly,rect(b+r.x,a+r.y)))pix(rect(b,a),1)
				if(dr.poly.length>0)draw_lines(dr.poly.concat(dr.poly[0]).map(p=>rsub(p,rect(r.x,r.y))),0,ANTS,deck)
				frame=t,dr.sel_here=rcopy(r),dr.sel_start=rcopy(r)
				dr.omask=image_copy(dr.mask);dr.omask.pix.forEach((v,i)=>dr.omask.pix[i]=v!=0)
				bg_scoop_selection()
			}dr.poly=[]
		}
		if(dr.mask&&dr.limbo){
			if(ev.dir=='left' ){ev.dir=0,dr.sel_here.x--}
			if(ev.dir=='up'   ){ev.dir=0,dr.sel_here.y--}
			if(ev.dir=='right'){ev.dir=0,dr.sel_here.x++}
			if(ev.dir=='down' ){ev.dir=0,dr.sel_here.y++}
			if(ev.exit){dr.limbo=dr.mask=dr.omask=null,bg_end_lasso()}
		}
	}
	if(dr.tool=='poly'){
		if(ev.md){dr.poly=[rect(ev.dpos.x,ev.dpos.y)]}
		else if(ev.drag&&dr.poly.length>0){const l=last(dr.poly);if(ev.pos.x!=l.x||ev.pos.y!=l.y)dr.poly.push(rcopy(ev.pos))}
		else if(ev.mu){
			dr.poly.push(rcopy(ev.dpos)),bg_scratch();const t=frame;frame=draw_frame(dr.scratch)
			draw_poly(dr.poly,bg_fill()),draw_lines(dr.poly,dr.brush,bg_pat(),deck)
			bg_scratch_under(),frame=t,bg_edit(),bg_scratch_clear(),dr.poly=[]
		}
	}
	if(dr.tool=='lasso'||dr.tool=='poly'){
		const o=rsub(dr.sel_here,dr.sel_start);o.w=o.h=0
		draw_lines(dr.poly.map(p=>radd(o,con_to_screen(p))),dr.tool=='lasso'?0:dr.brush,dr.tool=='lasso'?ANTS:bg_pat(),deck)
	}
	if(dr.tool=='fill'&&ev.mu){
		const bg=container_image(con(),1), t=frame;bg_scratch(),frame=draw_frame(dr.scratch)
		draw_fill(ev.pos,ev.rup?0:bg_pat(),bg),frame=t,bg_edit(),bg_scratch_clear()
	}
	if(!bg_has_sel()&&!bg_has_lasso()){
		if(dr.fatbits){
			if(ev.dir=='left' )dr.offset.x-=ev.shift?dr.grid_size.x:1
			if(ev.dir=='right')dr.offset.x+=ev.shift?dr.grid_size.x:1
			if(ev.dir=='up'   )dr.offset.y-=ev.shift?dr.grid_size.y:1
			if(ev.dir=='down' )dr.offset.y+=ev.shift?dr.grid_size.y:1
			clamp_fatbits();if(ev.exit)dr.fatbits=0,ev.exit=0
		}else{tracking()}
	}
}
export const bg_end_lasso=_=>{
	if(uimode!='draw'||dr.tool!='lasso')return
	const data=dr.mask&&dr.limbo, diffrect=!requ(dr.sel_here,dr.sel_start);let diffmask=dr.omask==null||dr.omask.pix.length!=dr.mask.pix.length;
	if(dr.omask&&!diffmask)for(let z=0;data&&z<dr.mask.pix.length;z++)if((dr.mask.pix[z]>0)!=(dr.omask.pix[z]>0)){diffmask=1;break}
	if(data&&(diffrect||diffmask||dr.lasso_dirty)){
		bg_scratch();const t=frame;frame=draw_frame(dr.scratch),bg_draw_lasso(dr.sel_here,dr.sel_start,0,dr.fill),frame=t,bg_edit(),bg_scratch_clear()
	}dr.poly=[],dr.mask=null,dr.omask=null,dr.limbo=null,dr.lasso_dirty=0,dr.sel_here=rect(),dr.sel_start=rect()
}
export const bg_end_selection=_=>{
	if(uimode!='draw'||dr.tool!='select')return
	if(dr.sel_here.w<=0&&dr.sel_here.h<=0)return
	bg_edit_sel(),dr.sel_start=rcopy(ev.dpos),dr.sel_here=rcopy(ev.dpos)
}
export const bg_delete_selection=_=>{
	if(bg_has_lasso()){
		dr.mask=null,bg_scratch();const t=frame;frame=draw_frame(dr.scratch),bg_draw_lasso(dr.sel_here,dr.sel_start,0,dr.fill),frame=t
		bg_edit(),bg_scratch_clear(),bg_end_lasso();return
	}
	if(!bg_has_sel())return
	if(dr.limbo!=null&&dr.sel_start.w<=0&&dr.sel_start.h<=0){dr.sel_here=rect(),dr.limbo=null,dr.limbo_dither=0;return}
	if(dr.sel_start.w<=0&&dr.sel_start.h<=0)dr.sel_start=rcopy(dr.sel_here)
	dr.sel_here=rect(),dr.limbo=image_make(rect(1,1)),dr.limbo_dither=0,bg_edit_sel(),dr.sel_start=rcopy(ev.dpos),dr.sel_here=rcopy(ev.dpos)
}
export const bg_paste=(image,fit)=>{
	const clip=con_dim(), f=rect(clip.w*.75,clip.h*.75);let s=image.size
	if(fit&&(s.x>f.x||s.y>f.y)){const scale=min(f.x/s.x,f.y/s.y);s=rect(s.x*scale,s.y*scale)}if(!s.x)return
	if(bg_has_sel()){bg_scoop_selection(),dr.limbo=image,dr.limbo_dither=0}
	else{settool('select'),dr.sel_start=rect(),dr.sel_here=rcenter(con_view_dim(),s),dr.limbo=image,dr.limbo_dither=0}
}
export const handle_size=_=>enable_touch?10:5
export const draw_handles=r=>{
	const h=handle_size(), pal=deck.patterns.pal.pix
	const x0=r.x+1-h, x2=r.x+r.w-1, y0=r.y+1-h, y2=r.y+r.h-1, x1=0|((x2-x0)/2+x0), y1=0|((y2-y0)/2+y0)
	draw_invert(pal,rclip(rect(x0,y0,h,h),frame.clip))
	draw_invert(pal,rclip(rect(x0,y2,h,h),frame.clip))
	draw_invert(pal,rclip(rect(x2,y0,h,h),frame.clip))
	draw_invert(pal,rclip(rect(x2,y2,h,h),frame.clip))
	draw_invert(pal,rclip(rect(x2,y1,h,h),frame.clip))
	draw_invert(pal,rclip(rect(x1,y2,h,h),frame.clip))
	draw_invert(pal,rclip(rect(x1,y0,h,h),frame.clip))
	draw_invert(pal,rclip(rect(x0,y1,h,h),frame.clip))
}
export const in_handle=r=>{
	const h=handle_size(), x0=r.x+1-h, x2=r.x+r.w-1, y0=r.y+1-h, y2=r.y+r.h-1, x1=0|((x2-x0)/2+x0), y1=0|((y2-y0)/2+y0)
	if(over(rect(x0,y0,h,h)))return 4
	if(over(rect(x0,y2,h,h)))return 6
	if(over(rect(x2,y0,h,h)))return 2
	if(over(rect(x2,y2,h,h)))return 0
	if(over(rect(x2,y1,h,h)))return 1
	if(over(rect(x1,y0,h,h)))return 3
	if(over(rect(x0,y1,h,h)))return 5
	if(over(rect(x1,y2,h,h)))return 7;return -1
}
export const bg_select=_=>{
	if(uimode!='draw'||dr.tool!='select')return rect(0,0,0,0)
	let s=rcopy(dr.sel_here), has_sel=s.w>0||s.h>0, in_sel=has_sel&&dover(s)
	const ax=min(ev.dpos.x,ev.pos.x), bx=max(ev.dpos.x,ev.pos.x), ay=min(ev.dpos.y,ev.pos.y), by=max(ev.dpos.y,ev.pos.y), h=handle_size()
	const x0=s.x+1-h, x2=s.x+s.w-1, y0=s.y+1-h, y2=s.y+s.h-1, x1=0|((x2-x0)/2+x0), y1=0|((y2-y0)/2+y0), dx=ev.pos.x-ev.dpos.x, dy=ev.pos.y-ev.dpos.y
	const sz=dr.limbo?dr.limbo.size:rect(dr.sel_start.w,dr.sel_start.h)
	handle=(rw,rh,ox,oy,ow,oh)=>{if(has_sel&&(ev.mu||ev.drag)&&dover(rect(rw,rh,h,h))){
		s=rnorm(keep_ratio(rect(s.x+ox,s.y+oy,s.w+ow,s.h+oh),sz))
		if(ev.mu)dr.sel_here=snapr(s);bg_scoop_selection(),uicursor=cursor.drag;return 1
	};return 0}
	if(in_layer()){
		if     (handle(x2,y2,  0, 0, dx, dy)){} // se
		else if(handle(x0,y2, dx, 0,-dx, dy)){} // sw
		else if(handle(x2,y0,  0,dy, dx,-dy)){} // ne
		else if(handle(x0,y0, dx,dy,-dx,-dy)){} // nw
		else if(handle(x2,y1,  0, 0, dx,  0)){} // e
		else if(handle(x1,y0,  0,dy,  0,-dy)){} // n
		else if(handle(x0,y1, dx, 0,-dx,  0)){} // w
		else if(handle(x1,y2,  0, 0,  0, dy)){} // s
		else if(ev.md&&in_sel){bg_scoop_selection()} // begin move
		else if((ev.mu||ev.drag)&&in_sel){s.x+=dx, s.y+=dy;if(ev.mu)dr.sel_here=snap(s)} // move/finish
		else if(ev.md&&!in_sel){if(has_sel){draw_limbo(con_to_screen(s),dr.fatbits),bg_end_selection(),has_sel=0}s=rcopy(dr.sel_here)} // begin create
		else if(ev.mu||ev.drag){s=snapr(rect(ax,ay,bx-ax,by-ay));if(ev.mu)dr.sel_here=s} // size/finish
	}
	if(has_sel)draw_limbo(con_to_screen(s),dr.fatbits)
	if(in_layer()){
		let nudge=0
		if(has_sel&&ev.dir=='left' ){ev.dir=0,bg_scoop_selection(),dr.sel_here.x-=ev.shift?dr.grid_size.x:1,nudge=1}
		if(has_sel&&ev.dir=='up'   ){ev.dir=0,bg_scoop_selection(),dr.sel_here.y-=ev.shift?dr.grid_size.y:1,nudge=1}
		if(has_sel&&ev.dir=='right'){ev.dir=0,bg_scoop_selection(),dr.sel_here.x+=ev.shift?dr.grid_size.x:1,nudge=1}
		if(has_sel&&ev.dir=='down' ){ev.dir=0,bg_scoop_selection(),dr.sel_here.y+=ev.shift?dr.grid_size.y:1,nudge=1}
		if(nudge&&ev.shift)dr.sel_here=snap(dr.sel_here)
		if(ev.exit){dr.limbo=null,dr.limbo_dither=0,bg_end_selection()}
	}
	return s
}
export const bg_box_to_lasso=_=>{
	const r=dr.sel_here
	if(dr.tool=='select'){
		dr.tool='lasso',bg_scoop_selection();const s=dr.sel_start, l=dr.limbo, t=frame
		dr.limbo=image_make(rect(r.w,r.h)),frame=draw_frame(dr.limbo)
		if(dr.limbo_dither){draw_dithered(frame.clip,l,1,dr.omask,dr.dither_threshold),dr.limbo_dither=0}else{draw_scaled(frame.clip,l,1)}frame=t
		dr.mask=image_make(rect(r.w,r.h)),dr.mask.pix.fill(1)
		if(s.w>0&&s.h>0){dr.omask=image_make(rect(s.w,s.h)),dr.omask.pix.fill(1)}else{dr.omask=null}
	}
}
export const bg_regenerate_lasso_outline=_=>{
	const r=dr.sel_here
	const set=(p,v)=>dr.mask.pix[p.x+p.y*dr.sel_here.w]=v
	const get=p=>(p.x<0||p.y<0||p.x>=dr.sel_here.w||p.y>=dr.sel_here.h)?0:dr.mask.pix[p.x+p.y*dr.sel_here.w]
	for(let a=0;a<r.h;a++)for(let b=0;b<r.w;b++)if(get(rect(b,a))){ // regenerate the ANTS outline
		const n=get(rect(b-1,a))&&get(rect(b,a-1))&&get(rect(b+1,a))&&get(rect(b,a+1));if(!n)set(rect(b,a),ANTS)
	}
}
export const bg_tighten=_=>{
	const r=dr.sel_here
	bg_box_to_lasso()
	const set=(p,v)=>dr.mask.pix[p.x+p.y*dr.sel_here.w]=v
	const get=p=>(p.x<0||p.y<0||p.x>=dr.sel_here.w||p.y>=dr.sel_here.h)?0:dr.mask.pix[p.x+p.y*dr.sel_here.w]
	let changed=1,background=dr.fill;while(changed){changed=0 // erode the mask, iterating to a fixed point
		for(let a=0;a<r.h;a++)for(let b=0;b<r.w;b++)if(get(rect(b,a))&&dr.limbo.pix[b+a*r.w]==background){
			const n=get(rect(b-1,a))&&get(rect(b,a-1))&&get(rect(b+1,a))&&get(rect(b,a+1));if(!n)set(rect(b,a),0),changed=1
		}
	}
	bg_regenerate_lasso_outline()
	const d=find_occupied(dr.mask,0);if(d.w<1||d.h<1||(d.w==r.w&&d.h==r.h))return // trim excess?
	dr.limbo=image_copy(dr.limbo,d);if(dr.mask)dr.mask=image_copy(dr.mask,d);if(dr.omask)dr.omask=image_copy(dr.omask,d)
	dr.sel_here .x+=d.x,dr.sel_here .y+=d.y,dr.sel_here .w=d.w,dr.sel_here .h=d.h
	dr.sel_start.x+=d.x,dr.sel_start.y+=d.y,dr.sel_start.w=d.w,dr.sel_start.h=d.h
}
export const bg_outline=_=>{
	const r=dr.sel_here;bg_box_to_lasso()
	dr.mask.pix.forEach((v,i)=>dr.mask.pix[i]=v!=0) // strip the ANTS outline
	const l=image_copy(dr.limbo);for(let a=0;a<r.h;a++)for(let b=0;b<r.w;b++){
		const i=b+a*r.w;if(dr.limbo.pix[i]||!dr.mask.pix[i])continue;let n=0
		if(b>0    ){const i=(b-1)+(a  )*r.w; n|=dr.limbo.pix[i]&&dr.mask.pix[i]}
		if(b<r.w-1){const i=(b+1)+(a  )*r.w; n|=dr.limbo.pix[i]&&dr.mask.pix[i]}
		if(a>0    ){const i=(b  )+(a-1)*r.w; n|=dr.limbo.pix[i]&&dr.mask.pix[i]}
		if(a<r.h-1){const i=(b  )+(a+1)*r.w; n|=dr.limbo.pix[i]&&dr.mask.pix[i]}
		if(n)l.pix[i]=bg_pat()
	}dr.limbo=l,dr.lasso_dirty=1;bg_regenerate_lasso_outline()
}

// Object Edit Mode

export const ob_order=_=>{ob.sel.sort((av,bv)=>ln(ifield(av,'index'))-ln(ifield(bv,'index')))}
export const ob_move_up=_=>{if(ob.sel.length<1)return;ob_order();ob.sel.slice(0).reverse().map(o=>iwrite(o,lms('index'),lmn(ln(ifield(o,'index'))+1)))}
export const ob_move_dn=_=>{if(ob.sel.length<1)return;ob_order();ob.sel                   .map(o=>iwrite(o,lms('index'),lmn(ln(ifield(o,'index'))-1)))}
export const ob_edit_prop=(key,value)=>{
	const before={}, after={}
	ob.sel.map(w=>{const n=ls(ifield(w,'name')),bp={},ap={}; bp[key]=ifield(w,key),ap[key]=value,before[n]=bp,after[n]=ap})
	edit(edit_target({type:'ob_props',before,after}))
}
export const ob_create=props=>{
	edit(edit_target({type:'ob_create',props}))
}
export const ob_destroy=_=>{
	if(ob.sel.length<1)return
	const props=ob.sel.map(w=>lmd([lms('name')],[ifield(w,'name')]))
	edit(edit_target({type:'ob_destroy',props})),ob.sel=[]
}
export const can_coalesce=move=>{
	if(has_redo()||doc_hist.length==0)return false
	const prev=doc_hist[doc_hist_cursor-1];if(prev.type!='ob_props')return false
	if(Object.keys(prev.after).length!=ob.sel.length)return false
	for(let z=0;z<ob.sel.length;z++){
		const key=Object.keys(prev.after)[z], val=prev.after[key]
		if(ls(ifield(ob.sel[z],'name'))!=key)return false
		if(Object.keys(val).length!=(move?1:2))return false
		const keys=Object.keys(val)
		if(keys[0]!='pos')return false
		if(!move&&keys[1]!='size')return false
	}return true
}
export const ob_move=(delta,coalesce)=>{
	if(ob.sel.length<1)return
	if(coalesce&&can_coalesce(1)){
		const r=doc_hist[doc_hist_cursor-1];
		Object.values(r.after).map(z=>z.pos=lmpair(radd(getpair(z.pos),delta))),undo(),redo()
	}else{
		const before={},after={};ob.sel.map(w=>{
			const n=ls(ifield(w,'name')),f=ifield(w,'pos'),fv=getpair(f)
			before[n]={pos:f},after[n]={pos:lmpair(radd(fv,delta))}
		}),edit(edit_target({type:'ob_props',before,after}))
	}
}
export const ob_resize=(size,coalesce)=>{
	if(ob.sel.length!=1)return;const w=ob.sel[0]
	if(coalesce&&can_coalesce(0)){
		const r=doc_hist[doc_hist_cursor-1],after=Object.values(r.after)[0]
		after.pos =lmpair(rect(size.x,size.y))
		after.size=lmpair(rect(size.w,size.h)),undo(),redo()
	}else{
		const bp={pos:ifield(w,'pos')            ,size:ifield(w,'size')           }
		const ap={pos:lmpair(rect(size.x,size.y)),size:lmpair(rect(size.w,size.h))}
		const before={},after={},n=ls(ifield(w,'name'));before[n]=bp,after[n]=ap
		edit(edit_target({type:'ob_props',before,after}))
	}
}
export const proto_prop=(target,key,value)=>{
	edit(edit_target({type:'proto_props',keys:[lms(key)],before:[ifield(target,key)],after:[value]}))
}
export const proto_size=(target,size,margin)=>{
	const o=image_resize(image_copy(ifield(target,'image')),getpair(ifield(target,'size'))), n=image_make(size), c=rpair(rect(0,0),size)
	draw_9seg(c,n,o,getrect(ifield(target,'margin')),c,1,null)
	edit(edit_target({
		type:'proto_props',keys:['size','image','margin'].map(lms),
		before:[ifield(target,'size'),o,ifield(target,'margin')],after:[lmpair(size),n,lmrect(margin)]
	}))
}
export const object_select=x=>{ob.sel=[x]}
export const object_properties=x=>{
	ob.sel=[x]
	if(button_is     (x))modal_enter('button_props')
	if(field_is      (x))modal_enter('field_props' )
	if(slider_is     (x))modal_enter('slider_props')
	if(canvas_is     (x))modal_enter('canvas_props')
	if(grid_is       (x))modal_enter('grid_props'  )
	if(contraption_is(x))modal_enter('contraption_props')
}
export const is_resizable=_=>ob.sel.length==1&&(contraption_is(ob.sel[0])?lb(ifield(ob.sel[0].def,'resizable')):1)
export const object_editor=_=>{
	const wids=con_wids(), pal=deck.patterns.pal.pix
	wids.v.map(wid=>{
		const w=unpack_widget(wid), sel=ob.sel.some(x=>x==wid);w.size=con_to_screen(w.size)
		if(sel){draw_box(inset(w.size,-1),0,ANTS)}else if(ob.show_bounds){draw_boxinv(pal,inset(w.size,-1))}
		if(sel&&is_resizable())draw_handles(w.size)
		if(ob.show_bounds){
			if(lb(ifield(wid,'volatile'))){
				draw_line(rect(w.size.x,w.size.y,w.size.x+w.size.w,w.size.y+w.size.h),0,1,deck)
				draw_line(rect(w.size.x+w.size.w,w.size.y,w.size.x,w.size.y+w.size.h),0,1,deck)
			}
			const badge=rect(w.size.x+w.size.w-10,w.size.y,10,10)
			if(w.locked                  )draw_rect(badge,1),draw_icon(rect(badge.x+1,badge.y+1),LOCK,32),badge.y+=10
			if(lb(ifield(wid,"animated")))draw_rect(badge,1),draw_icon(rect(badge.x+1,badge.y+1),ANIM,32)
		}
	})
	if(!in_layer())return
	if(ob.sel.length>0){
		let nudge=0
		if(ev.dir=='left' )ob_move(rect(-1*(ev.shift?dr.grid_size.x:1), 0),1),nudge=1
		if(ev.dir=='right')ob_move(rect( 1*(ev.shift?dr.grid_size.x:1), 0),1),nudge=1
		if(ev.dir=='up'   )ob_move(rect( 0,-1*(ev.shift?dr.grid_size.y:1)),1),nudge=1
		if(ev.dir=='down' )ob_move(rect( 0, 1*(ev.shift?dr.grid_size.y:1)),1),nudge=1
		if(nudge&&ev.shift&&ob.sel.length){
			const p=ob.sel.reduce((p,w)=>rmin(p,getpair(ifield(w,'pos'))),rect(RTEXT_END,RTEXT_END))
			ob_move(snap_delta(p),1)
		}
	}
	const ish=is_resizable()?in_handle(unpack_widget(ob.sel[0]).size):-1
	const isw=wids.v.some(w=>over(unpack_widget(w).size)&&ob.sel.some(x=>x==w))
	const a=ev.pos,b=ob.prev,dragged=a.x!=b.x||a.y!=b.y
	const sr=rnorm(rect(ev.dpos.x,ev.dpos.y,ev.pos.x-ev.dpos.x,ev.pos.y-ev.dpos.y)), box=sr.w>1||sr.h>1;
	if(isw&&ev.dclick){
		for(let z=count(wids)-1;z>=0;z--){
			const wid=wids.v[z], w=unpack_widget(wid)
			if(over(w.size)){object_properties(wid);break}
		}
	}
	else if(isw&&ev.mu&&!box){
		for(let z=ob.sel.length-1;z>=0;z--){
			const wid=ob.sel[z], w=unpack_widget(wid)
			if(over(w.size)){if(ev.shift){ob.sel=ob.sel.filter(x=>x!=wid)}else{ob.sel=[wid]};break}
		}
	}
	else if(ish!=-1&&ev.md){ob.resize=1,ob.resize_first=1,ob.handle=ish,ob.prev=rcopy(ev.pos),ob.orig=unpack_widget(ob.sel[0]).size}
	else if(isw    &&ev.md){ob.move  =1,ob.move_first  =1,ob.prev=rcopy(ev.pos)}
	else if(ob.resize&&(!ev.drag||!ob.sel.length)){ob.resize=0,ob.resize_first=0}
	else if(ob.move&&(!ev.drag||!ob.sel.length)){
		if(ob.sel.length){
			const p=ob.sel.reduce((p,w)=>rmin(p,getpair(ifield(w,'pos'))),rect(RTEXT_END,RTEXT_END))
			ob_move(snap_delta(p),!ob.move_first)
		}
		ob.move=0,ob.move_first=0
	}
	else if(ob.resize){
		let delta=rsub(ev.pos,ev.dpos), r=rcopy(ob.orig)
		if(ob.handle==0){r.w+=delta.x, r.h+=delta.y}
		if(ob.handle==2){r.w+=delta.x, r.h-=delta.y, r.y+=delta.y}
		if(ob.handle==6){r.w-=delta.x, r.h+=delta.y, r.x+=delta.x}
		if(ob.handle==4){r.w-=delta.x, r.h-=delta.y, r.x+=delta.x, r.y+=delta.y}
		if(ob.handle==1){r.w+=delta.x}
		if(ob.handle==3){r.h-=delta.y, r.y+=delta.y}
		if(ob.handle==5){r.w-=delta.x, r.x+=delta.x}
		if(ob.handle==7){r.h+=delta.y}
		r=snapr(r), r.w=max(8,r.w), r.h=max(8,r.h)
		if(dragged)ob_resize(r,!ob.resize_first),ob.resize_first=0,ob.prev=rcopy(ev.pos)
	}
	else if(ob.move){
		const delta=rsub(a,b)
		if(dragged)ob_move(delta,!ob.move_first),ob.move_first=0,ob.prev=rcopy(ev.pos)
	}else{
		if(box&&ev.drag)draw_box(con_to_screen(sr),0,ANTS); if(box&&(ev.drag||ev.mu))ob.sel=[]
		let f=0;for(let z=count(wids)-1;z>=0;z--){ // backward pass for selection priority(!)
			const wid=wids.v[z], w=unpack_widget(wid), sel=ob.sel.some(x=>x==wid), overlap=rclip(w.size,sr)
			const insel=box?overlap.w>=1&&overlap.h>=1: over(w.size)&&dover(w.size), c=ev.mu&insel
			if(c)f=1; if(!c)continue; if(box){ob.sel.push(wid);continue}
			if(!sel){if(!ev.shift)ob.sel=[];ob.sel.push(wid);break}
		}if(ev.mu&&!f)ob.sel=[]
	}
}
export const prototype_size_editor=_=>{
	const def=con(),drag=rect(0,0,0,0);if(uimode=='interact'||!prototype_is(def))return 0;let r=0
	const delta=rsub(screen_to_con(ev.pos),screen_to_con(ev.dpos)),view=con_clip()
	let resize=0, s=getpair(ifield(def,'size')), m=getrect(ifield(def,'margin')),om=rcopy(m)
	if(view.x!=0&&view.y!=0&&view.w!=frame.size.x&&view.h!=frame.size.y&&uimode!='draw'){
		// resize handle
		let sh=rpair(radd(con_to_screen(s),rect(1,1)),rect(8,8));if(over(sh))r=1;
		if((ev.drag||ev.mu)&&dover(sh)&&(delta.x!=0||delta.y!=0)){
			s=snap(rmax(rect(1,1),radd(s,delta))),sh=rpair(radd(con_to_screen(s),rect(1,1)),rect(8,8))
			draw_box(con_to_screen(rpair(rect(0,0),s)),0,ANTS),r=1;if(ev.mu)resize=1
		}
		draw_rect(sh,32),draw_box(sh,0,1);if(over(sh))uicursor=cursor.drag
		draw_text(rect(sh.x+10,sh.y+10,100,20),`${s.x} x ${s.y}`,FONT_MONO,1)
		// margin handles
		const h_margin=(i,v,o)    =>rpair(rsub(con_to_screen(v),o),i.size)
		const m_margin=(i,v,o,a,d)=>{const h=h_margin(i,v,o);if(over(h)||dover(h))r=1;if((ev.drag||ev.mu)&&dover(h))m[d]+=a,drag[d]=1;}
		const i_margin=(h,i)      =>{image_paste(h,frame.clip,i,frame.image,0);if(over(h))uicursor=cursor.drag;}
		const l_label =(h,v)      =>{const l=`${v}`,t=font_textsize(FONT_MONO,l);draw_text(rect(h.x-2-t.x        ,h.y-3  ,60,20),l,FONT_MONO,1)}
		const t_label =(h,v)      =>{const l=`${v}`,t=font_textsize(FONT_MONO,l);draw_text(rect(h.x+3-(0|(t.x/2)),h.y-t.y,60,20),l,FONT_MONO,1)}
		const l_margin=(i,v,o,d)  =>{const h=h_margin(i,v,o);if(drag[d])l_label(h,m[d]);i_margin(h,i)}
		const t_margin=(i,v,o,d)  =>{const h=h_margin(i,v,o);if(drag[d])t_label(h,m[d]);i_margin(h,i)}
		if(ob.show_margins){
			m_margin(HANDLES[0],rect(m.x    ,0      ),rect(3,11), delta.x,'x')
			m_margin(HANDLES[1],rect(0      ,m.y    ),rect(11,3), delta.y,'y')
			m_margin(HANDLES[0],rect(s.x-m.w,0      ),rect(3,11),-delta.x,'w');if(drag.x&&drag.w)m.w+=delta.x,drag.w=0
			m_margin(HANDLES[1],rect(0      ,s.y-m.h),rect(11,3),-delta.y,'h');if(drag.y&&drag.h)m.h+=delta.y,drag.h=0
			m=normalize_margin(lmrect(m),getpair(ifield(def,'size')))
			t_margin(HANDLES[0],rect(m.x    ,0      ),rect(3,11),'x')
			l_margin(HANDLES[1],rect(0      ,m.y    ),rect(11,3),'y')
			t_margin(HANDLES[0],rect(s.x-m.w,0      ),rect(3,11),'w')
			l_margin(HANDLES[1],rect(0      ,s.y-m.h),rect(11,3),'h')
		}
	}
	if(ob.show_margins){
		const m0=con_to_screen(rect(m.x,0,1,s.y    ));draw_vline(m0.x,m0.y,m0.y+m0.h,ANTS)
		const m1=con_to_screen(rect(0,m.y,s.x,1    ));draw_hline(m1.x,m1.x+m1.w,m1.y,ANTS)
		const m2=con_to_screen(rect(s.x-m.w,0,1,s.y));draw_vline(m2.x,m2.y,m2.y+m2.h,ANTS)
		const m3=con_to_screen(rect(0,s.y-m.h,s.x,1));draw_hline(m3.x,m3.x+m3.w,m3.y,ANTS)
	}
	const move_margin=m.x!=om.x||m.y!=om.y||m.w!=om.w||m.h!=om.h
	if(resize){proto_size(def,s,m)}
	else if(ev.mu&&move_margin){proto_prop(def,'margin',lmrect(m))}
	return r||resize||move_margin
}


// Toolbars

let toolbars_enable=0, tzoom=1 // should be off by default?
const tcellw=22, tcellh=19, tgap=1, toolsize=rect(tcellw*2+1,tcellh*18+tgap+1), tfb=image_make(toolsize), tid=new ImageData(toolsize.x,toolsize.y)
const tooltypes=['select','pencil','lasso','line','fill','poly','rect','fillrect','ellipse','fillellipse']
const patorder=[0,1,4,5,8,9,16,17,12,13,18,19,20,21,22,23,24,25,26,27,2,6,3,7,10,11,14,15,28,29,30,31] // pleasing visual ramps for 2 columns

export const toolbars=_=>{
	if(!toolbars_enable||kc.on)return
	if(ms.type||uimode=='script'){
		clr=x=>{const c=q(x);c.getContext('2d').clearRect(0,0,c.width,c.height);}
		clr('#ltools'),clr('#rtools');return
	}
	const toolbar=(element,render,behavior)=>{
		const c=element.getBoundingClientRect()
		const pos =rint(rect((ev.rawpos .x-c.x)/tzoom,(ev.rawpos .y-c.y)/tzoom))
		const dpos=rint(rect((ev.rawdpos.x-c.x)/tzoom,(ev.rawdpos.y-c.y)/tzoom))
		tfb.pix.fill(0),frame=draw_frame(tfb),draw_box(rpair(rect(),toolsize),0,1),behavior(pos,dpos)
		const anim=deck.patterns.anim, pal=deck.patterns.pal.pix
		const animated=rin(rect(c.x,c.y,c.width,c.height),ev.rawpos)&&dr.show_anim?(0|(frame_count/4)):0
		const anim_pattern=(pix,x,y)=>pix<28||pix>31?pix: anim[pix-28][animated%max(1,anim[pix-28].length)]
		const draw_pattern=(pix,x,y)=>pix<2?(pix?1:0): pix>31?(pix==32?0:1): pal_pat(pal,pix,x,y)&1
		const draw_color  =(pix,x,y)=>pix>47?0: pix>31?pix-32: draw_pattern(pix,x,y)?15:0
		const data=tid.data;for(let z=0,d=0,y=0;y<tid.height;y++)for(let x=0;x<tid.width;x++,z++){
			const pix=tfb.pix[z], a=anim_pattern(pix,x,y), c=draw_color(a,x,y), cv=COLORS[c]
			data[d++]=0xFF&(cv>>16),data[d++]=0xFF&(cv>>8),data[d++]=0xFF&(cv),data[d++]=0xFF
		}
		render.getContext('2d').putImageData(tid,0,0)
		const g=element.getContext('2d');g.imageSmoothingEnabled=tzoom!=(0|tzoom),g.save(),g.scale(tzoom,tzoom),g.drawImage(render,0,0),g.restore()
	}
	const toolbtn=(pos,dn,b,icon,active)=>{
		const i=rcenter(b,rect(16,16))
		draw_box(b,0,1);if(active)draw_rect(b,1);draw_icon(i,TOOLS[icon],active?0:1)
		if(rin(b,pos))uicursor=cursor.point;return rin(b,pos)&&rin(b,dn)&&ev.mu
	}
	const modebtn=(pos,dn,b,text,active)=>{
		draw_box(b,0,1);if(active)draw_rect(inset(b,2),1);draw_textc(b,text,FONT_BODY,active?0:1)
		if(rin(b,pos))uicursor=cursor.point;return rin(b,pos)&&rin(b,dn)&&ev.mu
	}
	const scrollbtn=(pos,dn,b,icon)=>{
		const i=rcenter(b,rect(12,12)),active=rin(b,dn)&&(ev.mu||ev.drag)
		draw_box(b,0,1);if(active)draw_rect(b,1);draw_icon(i,ARROWS[icon],active?0:1)
		if(rin(b,pos))uicursor=cursor.point;return rin(b,pos)&&active&&ev.mu
	}
	const brushbtn=(pos,dn,b,brush)=>{
		const i=rint(rect(b.x+(b.w/2),b.y+(b.h/2)))
		draw_box(b,0,1),draw_line(rect(i.x,i.y,i.x,i.y),brush,1,deck)
		if(dr.brush==brush)draw_box(inset(b,2),0,1)
		if(!rin(b,pos))return;uicursor=cursor.point;if(!ev.mu||!rin(b,dn))return
		setmode('draw');if(dr.tool=='select'||dr.tool=='lasso'||dr.tool=='fill')settool('pencil');dr.brush=brush
	}
	const cbrushbtn=(pos,dn,b,brush,bt)=>{
		const icon=bt.v[brush-24],oc=frame.clip;frame.clip=b
		draw_icon(rcenter(b,icon.size),icon,1),frame.clip=oc,draw_box(b,0,1)
		if(dr.brush==brush)draw_box(inset(b,2),0,1)
		if(!rin(b,pos))return;uicursor=cursor.point;if(!ev.mu||!rin(b,dn))return
		setmode('draw');if(dr.tool=='select'||dr.tool=='lasso'||dr.tool=='fill')settool('pencil');dr.brush=brush
	}
	const palbtn=(pos,dn,b,pattern)=>{
		if((dr.pickfill?dr.fill:dr.pattern)==pattern){draw_rect(inset(b,3),pattern),draw_box(inset(b,3),0,1)}else{draw_rect(b,pattern)}
		if(rin(b,pos)){uicursor=cursor.point;if(ev.mu&&rin(b,dn)){if(dr.pickfill){dr.fill=pattern}else{dr.pattern=pattern}}}draw_box(b,0,1)
	}
	toolbar(q('#ltools'),q('#lrender'),(pos,dn)=>{
		const bs=deck.brushes,bt=deck.brusht,th=count(bs)?17:tcellh;toolbar_scroll=clamp(0,toolbar_scroll,count(bs))
		draw_rect(rect(0,6*tcellh,toolsize.x,tgap),1)
		if(toolbtn(pos,dn,rect(0     ,0,tcellw+1,tcellh+1),0,uimode=='interact'))setmode('interact'),ev.mu=ev.md=0
		if(toolbtn(pos,dn,rect(tcellw,0,tcellw+1,tcellh+1),1,uimode=='object'  ))setmode('object'  ),ev.mu=ev.md=0
		for(let z=0;z<10;z++){
			if(toolbtn(pos,dn,rect((z%2)*tcellw,(1+(0|(z/2)))*tcellh,tcellw+1,tcellh+1),z+2,uimode=='draw'&&dr.tool==tooltypes[z])){
				settool(tooltypes[z]),ev.mu=ev.md=0
			}
		}
		let cy=(6*tcellh)+tgap,brow=0;for(let z=0;z<12-toolbar_scroll;z++){
			brushbtn(pos,dn,rect(0     ,cy,tcellw+1,th+1),z   +toolbar_scroll)
			brushbtn(pos,dn,rect(tcellw,cy,tcellw+1,th+1),z+12+toolbar_scroll)
			cy+=th,brow++
		}
		if(count(bs)){
			for(let bi=0;brow<12;bi++,cy+=th,brow++)cbrushbtn(pos,dn,rect(0,cy,toolsize.x,th+1),24+bi+max(toolbar_scroll-12,0),bt)
			draw_rect(rect(0,cy+1,toolsize.x,tgap),1),cy+=tgap
			if(toolbar_scroll>0        )if(scrollbtn(pos,dn,rect(0     ,cy,tcellw+1,toolsize.y-cy),0))toolbar_scroll--
			if(toolbar_scroll<count(bs))if(scrollbtn(pos,dn,rect(tcellw,cy,tcellw+1,toolsize.y-cy),1))toolbar_scroll++
		}
	})
	toolbar(q('#rtools'),q('#rrender'),(pos,dn)=>{
		draw_rect(rect(0,16*tcellh,toolsize.x,tgap),1)
		if(modebtn(pos,dn,rect(0,0     ,tcellw*2+1,tcellh+1),'Stroke',dr.pickfill==0))dr.pickfill=0
		if(modebtn(pos,dn,rect(0,tcellh,tcellw*2+1,tcellh+1),'Fill'  ,dr.pickfill==1))dr.pickfill=1
		if(dr.color){for(let z=0;z<16 ;z++)palbtn(pos,dn,rect(0,(2*tcellh)+z*tcellh,2*tcellw+1,tcellh+1),(z>=2?31:0)+z)}
		else        {for(let z=0;z<4*8;z++)palbtn(pos,dn,rect((z%2)*tcellw,(2*tcellh)+(0|(z/2))*tcellh+(z>=28?tgap:0),tcellw+1,tcellh+1),patorder[z])}
	})
}

// Script Editor

export const setscript=x=>{
	if(uimode!='script')sc.prev_mode=uimode;setmode('script')
	sc.status='', sc.target=lii(x)?x:x[0], sc.others=lii(x)?[]: x.slice(1)
	let v=ifield(sc.target,'script'), p=0
	if(!count(v))v=card_is  (sc.target)?(p=1,lms('on view do\n \nend')):
	               button_is(sc.target)?(p=1,lms('on click do\n \nend')):
	               grid_is  (sc.target)?(p=1,lms('on click row do\n \nend')):
	               field_is (sc.target)?(p=1,lms('on change val do\n \nend')):
	               slider_is(sc.target)?(p=1,lms('on change val do\n \nend')):
	               canvas_is(sc.target)?(p=1,lms('on click pos do\n \nend\n\non drag pos do\n \nend\n\non release pos do\n \nend')):v
	if(p&&widget_is(sc.target)&&!contraption_is(sc.target)&&lb(ifield(sc.target,'animated'))){v=lms(ls(v)+'\n\non view do\n \nend')}
	if(!count(v)&&contraption_is(sc.target)){const t=sc.target.def.template;if(t&&t.length)p=1,v=lms(t)}
	sc.status=p?'No existing script; populated a template.':'',sc.f=fieldstr(v),wid.active=0
}
export const finish_script=_=>{if(sc.next){setscript(sc.next),sc.next=null}else{setmode(sc.prev_mode)}}
export const close_script=next=>{
	sc.next=next,field_exit()
	try{const text=ls(rtext_string(sc.f.table));parse(text),script_save(lms(text)),finish_script()}
	catch(e){
		modal_enter('confirm_script')
		ms.message=lms(`The current script contains errors:\n\n${e.x}\n\nDo you wish to discard your changes?`),ms.verb=lms('Discard')
	}
}
export const script_editor=r=>{
	const field_position=(x,cursor)=>{
		if(x.layout.length<1)return rect(1,1);cursor=max(0,min(cursor,x.layout.length+1))
		const e=cursor>=x.layout.length?1:0, i=cursor-e, l=x.layout[i].line, c=i-x.lines[l].range.x
		return rect(l+1,c+1+e)
	}
	const mh=3+font_h(FONT_MENU)
	let overw=null;if(sc.xray){
		const wids=con_wids();let ow=0;for(let z=wids.v.length-1;z>=0;z--){
			const wid=wids.v[z],size=con_to_screen(unpack_widget(wid).size), o=ev.alt&&over(size)&&!ow, col=o?(overw=wid,13):44; ow|=o
			draw_textc(size,ls(ifield(wid,'name')),FONT_BODY,o?-1:col),draw_box(size,0,col)
			if(count(ifield(wid,'script')))draw_icon(rect(size.x-1,size.y),ICONS[ICON.lil],o?1:col)
			if(ev.alt&&ev.mu&&over(size)&&dover(size)){close_script(wid),ev.md=ev.mu=0;break}
		}if(ev.alt&&ev.mu)close_script(con()),ev.md=ev.mu=0
	}
	ui_codeedit(rect(r.x,r.y,r.w,r.h-mh),0,sc.f),draw_hline(r.x,r.x+r.w,r.y+r.h-mh-1,1)
	if(overw){uicursor=cursor.point;draw_textc(con_to_screen(unpack_widget(overw).size),ls(ifield(overw,'name')),FONT_BODY,-1)}
	if(sc.status.length){draw_text_fit(rect(r.x+3,r.y+r.h-mh+3,r.w,mh-6),sc.status,FONT_BODY,1);}
	else{
		let stat='';if(in_layer()&&wid.infield){
			const x=layout_richtext(deck,sc.f.table,FONT_MONO,ALIGN.left,r.w)
			let a=min(wid.cursor.x,wid.cursor.y), b=max(wid.cursor.x,wid.cursor.y)
			if(a!=b&&a<x.layout.length){
				a=max(0,min(a,x.layout.length)), b=max(0,min(b,x.layout.length))
				const ap=field_position(x,a),bp=field_position(x,b), l=(bp.x-ap.x)+1, c=b-a
				stat=`${l} line${l==1?'':'s'}, ${c} character${c==1?'':'s'} selected`
			}else{const p=field_position(x,min(a,b));stat=`Line ${p.x}, Column ${p.y}`}
		}
		const l=font_textsize(FONT_BODY,stat);draw_text(rect(3,r.y+r.h-mh+3,l.x,l.y),stat,FONT_BODY,1)
		stat=`script of ${sc.target.n}  '${ls(ifield(sc.target,'name'))}'${sc.others.length?` and ${sc.others.length} more`:''}`
		const t=layout_plaintext(stat,FONT_BODY,ALIGN.right,rect(r.x+r.w-6-20-l.x,font_h(FONT_BODY)))
		draw_text_wrap(rect(3+l.x+20,r.y+r.h-mh+3,t.size.x,t.size.y),t,1)
	}if(in_layer()&&ev.exit)close_script(),ev.exit=0
}

// Runtime

let viewed=lmd()
export const find_animated=_=>{
	const r=lmd();if(uimode!='interact')return r
	con_wids().v.map(wid=>{
		if(lb(ifield(wid,'animated'))&&!dget(viewed,wid))dset(r,wid,NONE)
		if(contraption_is(wid))ivalue(wid,'widgets').v.map(cwid=>{if(lb(ifield(cwid,'animated'))&&!dget(viewed,cwid))dset(r,cwid,ONE)})
	});return r
}
export const fire_animate=targets=>{
	const root=lmenv(),block=lmblk();primitives(root,deck),constants(root)
	targets.k.map(w=>{blk_cat(block,event_invoke(w,'view',lml([NONE]),null)),dset(viewed,w,ONE)})
	pushstate(root),pending_popstate=1,issue(root,block)
}
export const fire_view=target=>{
	const root=lmenv();primitives(root,deck),constants(root)
	const block=event_invoke(target,'view',lml([NONE]),null)
	ifield(target,'widgets').v.filter(w=>contraption_is(w)&&!dget(viewed,w)).map(w=>{blk_cat(block,event_invoke(w.viewproxy,'view',lml([NONE]),null)),dset(viewed,w,ONE)})
	pushstate(root),pending_popstate=1,issue(root,block)
}
export const interpret=_=>{
	viewed=lmd()
	if(msg.overshoot&&!running()&&!msg.pending_view&&!msg.next_view)msg.overshoot=0
	if(msg.pending_halt){if(running())halt();sleep_frames=0,sleep_play=0,msg.pending_view=0,msg.next_view=0}
	if(sleep_play&&sfx_any())return 0;sleep_play=0
	if(sleep_frames){sleep_frames--;return 0}
	const nomodal=_=>(ms.type==null||ms.type=='query'||ms.type=='listen')
	let quota=FRAME_QUOTA;while(1){
		while(nomodal()&&running()&&sleep_frames==0&&sleep_play==0&&quota>0){runop(),quota--,mark_dirty()}frame=context
		if(quota<=0&&running())msg.overshoot=1
		if(!nomodal()||quota<=0||sleep_frames||sleep_play){if(sleep_frames)sleep_frames--;break}
		if(!running()&&pending_popstate)popstate(),pending_popstate=0
		const a=find_animated()
		if(msg.pending_halt||pending_popstate){/*suppress other new events until this one finishes*/}
		else if(msg.pending_view){fire_view(con()),msg.pending_view=0}
		else if(msg.target_click){
			const arg=grid_is(msg.target_click)?lmn(msg.arg_click.y): canvas_is(msg.target_click)?lmpair(msg.arg_click): NONE
			fire_event_async(msg.target_click,'click',arg),msg.target_click=null
		}
		else if(msg.target_drag    ){fire_event_async(msg.target_drag    ,'drag'      ,lmpair(msg.arg_drag   )),msg.target_drag    =null}
		else if(msg.target_release ){fire_event_async(msg.target_release ,'release'   ,lmpair(msg.arg_release)),msg.target_release =null}
		else if(msg.target_run     ){fire_event_async(msg.target_run     ,'run'       ,msg.arg_run            ),msg.target_run     =null}
		else if(msg.target_link    ){fire_event_async(msg.target_link    ,'link'      ,msg.arg_link           ),msg.target_link    =null}
		else if(msg.target_order   ){fire_event_async(msg.target_order   ,'order'     ,msg.arg_order          ),msg.target_order   =null}
		else if(msg.target_ccell   ){fire_event_async(msg.target_ccell   ,'changecell',msg.arg_ccell          ),msg.target_ccell   =null}
		else if(msg.target_change  ){fire_event_async(msg.target_change  ,'change'    ,msg.arg_change         ),msg.target_change  =null}
		else if(msg.target_navigate){fire_event_async(msg.target_navigate,'navigate'  ,msg.arg_navigate       ),msg.target_navigate=null}
		else if(count(a)           ){fire_animate(a)}
		if(!running())break // not running, and no remaining events to process, so we're done for this frame
	}if(msg.next_view&&ms.type!='listen')msg.pending_view=1,msg.next_view=0 // no more than one view[] event per frame!
	return FRAME_QUOTA-quota
}

export const text_edit_menu=_=>{
	const selection=wid.fv!=null&&wid.cursor.x!=wid.cursor.y
	const rich=wid.fv!=null&&wid.f.style=='rich'
	if(menu_item('Undo',wid.hist_cursor>0              ,'z'))field_undo()
	if(menu_item('Redo',wid.hist_cursor<wid.hist.length,'Z'))field_redo()
	menu_separator()
	if(menu_item('Cut',selection,'x',menucut)){}
	if(menu_item('Copy',selection,'c',menucopy)){}
	if(rich&&menu_item('Copy Rich Text',selection,0,menucopyrich)){}
	if(menu_item('Paste',wid.fv!=null,'v',menupaste)){}
	if(menu_item('Clear',wid.fv!=null))wid.cursor=rect(0,RTEXT_END),field_keys('Delete',0)
	menu_separator()
	if(menu_item('Select All',wid.fv!=null,'a'))wid.cursor=rect(0,RTEXT_END)
}
export const all_menus=_=>{
	const blocked=running()||msg.overshoot
	const canlisten=!blocked&&(ms.type=='listen'||ms.type==null)
	menu_bar('Decker',canlisten&&!kc.on)
	if(menu_item('About...',1))modal_enter('about')
	if(menu_check('Listener',canlisten,ms.type=='listen','l')){if(ms.type!='listen'){modal_enter('listen')}else{modal_exit(0)}}
	menu_separator()
	menu_check('Fullscreen',1,is_fullscreen(),null,toggle_fullscreen)
	if(menu_check('Touch Input',1,enable_touch))enable_touch^=1,set_touch=1
	if(menu_check('Script Profiler',1,profiler))profiler^=1
	if(menu_check('Toolbars',tzoom>0,toolbars_enable))toolbars_enable^=1,resize()
	if(blocked){
		menu_bar('Script',1)
		if(menu_item('Stop',1)){msg.pending_halt=1;if(ms.type!='query'&&ms.type!='listen'){if(ms.type!=null){modal_exit(0)}setmode('object')}}
		menu_bar('Edit',(ms.type=='input'||ms.type=='save')&&wid.fv)
		text_edit_menu()
		return
	}
	menu_bar('File',(ms.type==null||ms.type=='recording')&&(!kc.on||uimode=='script'))
	if(uimode=='script'){
		if(menu_item('Close Script',1))close_script()
		if(menu_item('Save Script',1,'s')){
			try{const text=ls(rtext_string(sc.f.table));parse(text),script_save(lms(text));sc.status='Saved.'}
			catch(e){sc.status=`Error: ${e.x}`,wid.cursor=rect(e.i,e.i)}
		}
		menu_separator()
		menu_item('Import Script...',1,0,_=>open_text('.lil,.txt',text=>{field_exit(),sc.f=fieldstr(lms(text))}))
		if(menu_item('Export Script...',1))modal_enter('export_script')
		menu_separator()
		if(menu_item('Go to Deck',!deck_is(sc.target)           ))close_script(deck)
		const container=con()
		if(menu_item(`Go to ${prototype_is(container)?'Prototype':'Card'}`,sc.target!=container))close_script(container)
		if(menu_check('X-Ray Specs',!kc.on,sc.xray))sc.xray^=1
	}
	else if(ms.type=='recording'){
		menu_item('Import Sound...',1,0,_=>open_file('audio/*',load_sound))
		menu_separator();
		if(menu_item('Close Sound',1))modal_exit(0)
	}
	else{
		if(menu_item('New Deck...',1)){
			if(dirty){
				modal_enter('confirm_new')
				ms.message=lms('The current deck has unsaved changes.\nAre you sure you want to discard it?')
				ms.verb=lms('Discard')
			}else{load_deck(deck_read(''))}
		}
		if(menu_item('New Card',1)){const c=deck_add(deck,lms('card')), n=ln(ifield(ifield(deck,'card'),'index'));iwrite(c,lms('index'),lmn(n+1)),n_go([c],deck)}
		menu_separator()
		menu_item('Open...',1,0,_=>open_text('.html,.deck',text=>{load_deck(deck_read(text))}))
		if(menu_item('Save As...',1))modal_enter('save_deck')
		menu_separator()
		menu_item("Import Image...",1,0,_=>{open_file('image/*',load_image)})
		if(menu_item("Export Image...",1))modal_enter('export_image')
		menu_separator()
		if(menu_item('Purge Volatiles',1)){deck_purge(deck),msg.next_view=1}
		menu_separator()
		if(menu_item('Cards...'     ,1,'C'))modal_enter('cards')
		if(menu_item('Sounds...'    ,1,'S'))modal_enter('sounds')
		if(menu_item('Prototypes...',1,'T'))modal_enter('contraptions')
		if(menu_item('Resources...' ,1,   ))modal_enter('resources')
		if(menu_item('Properties...',1,   ))modal_enter('deck_props')
	}
	if(ms.type==null||wid.gv||wid.fv){
		menu_bar("Edit",wid.gv||wid.fv||(ms.type==null&&uimode=='interact')||uimode=='draw'||uimode=='object')
		if(wid.gv){
			const mutable=!wid.g.locked&&ms.type==null
			if(menu_item('Undo',wid.hist_cursor>0              ,'z'))grid_undo()
			if(menu_item('Redo',wid.hist_cursor<wid.hist.length,'Z'))grid_redo()
			menu_separator()
			if(menu_item('Copy Table',1,'c',menucopy)){}
			if(menu_item('Paste Table',mutable,'v',menupaste)){}
			menu_separator()
			if(menu_item('Delete Row',mutable&&wid.gv.row!=-1))grid_deleterow()
			if(menu_item('Add Row',mutable))grid_insertrow()
			if(menu_item('Query...',ms.type==null,'u'))modal_enter('query')
		}
		if(wid.fv)text_edit_menu()
		if(ms.type==null&&uimode=='interact'){
			if(menu_item('Undo',has_undo(),'z'))undo()
			if(menu_item('Redo',has_redo(),'Z'))redo()
			menu_separator()
			if(menu_item('Paste',1,'v',menupaste)){}
		}
		if(ms.type==null&&uimode=='draw'){
			const sel=bg_has_sel()||bg_has_lasso()
			if(menu_item('Undo',(!sel)&&has_undo(),'z'))undo()
			if(menu_item('Redo',(!sel)&&has_redo(),'Z'))redo()
			menu_separator()
			if(menu_item('Cut Image',sel,0,menucut)){}
			if(menu_item('Copy Image',sel,0,menucopy)){}
			if(menu_item('Paste',1,'v',menupaste)){}
			if(menu_item('Clear',1)){const t=dr.tool;if(!sel){settool('select'),dr.sel_here=rcopy(con_dim())}bg_delete_selection(),settool(t)}
			menu_separator()
			if(menu_item('Select All',1,'a')){settool('select'),dr.sel_here=rcopy(con_dim())}
			if(menu_item('Tight Selection',sel,'g'))bg_tighten()
			if(menu_item('Add Outline',sel))bg_outline()
			if(menu_item('Resize to Original',sel&&dr.tool=='select',0)){bg_scoop_selection();const s=dr.limbo.size;dr.sel_here.w=s.x,dr.sel_here.h=s.y}
			if(menu_item(`Resize to ${prototype_is(con())?'Prototype':'Card'}`,sel&&dr.tool=='select',0)){bg_scoop_selection(),dr.sel_here=con_dim()}
			menu_separator()
			if(menu_item('Invert',sel&&!dr.limbo_dither,'i')){
				if(bg_has_sel())bg_scoop_selection()
				const s=dr.limbo.size, pal=deck.patterns.pal.pix
				for(let z=0;z<dr.limbo.pix.length;z++)dr.limbo.pix[z]=1^draw_pattern(dr.limbo.pix[z],(z%s.x),0|(z/s.x))
			}
			if(menu_item('Flip Horizontal',sel)){
				if(bg_has_sel())bg_scoop_selection()
				image_flip_h(dr.limbo);if(dr.mask)image_flip_h(dr.mask);if(dr.omask&&dr.limbo_dither)image_flip_h(dr.omask);
			}
			if(menu_item('Flip Vertical'  ,sel)){
				if(bg_has_sel())bg_scoop_selection()
				image_flip_v(dr.limbo);if(dr.mask)image_flip_v(dr.mask);if(dr.omask&&dr.limbo_dither)image_flip_v(dr.omask);
			}
			if(menu_item('Rotate Left',sel,',')){
				const s=rect(dr.sel_here.w,dr.sel_here.h)
				if(bg_has_sel())bg_scoop_selection()
				image_flip_h(dr.limbo),image_flip(dr.limbo)
				if(dr.mask)image_flip_h(dr.mask),image_flip(dr.mask)
				if(dr.omask&&dr.limbo_dither)image_flip_h(dr.omask),image_flip(dr.omask)
				dr.sel_here.w=s.y,dr.sel_here.h=s.x
			}
			if(menu_item('Rotate Right',sel,'.')){
				const s=rect(dr.sel_here.w,dr.sel_here.h)
				if(bg_has_sel())bg_scoop_selection()
				image_flip(dr.limbo),image_flip_h(dr.limbo)
				if(dr.mask)image_flip(dr.mask),image_flip_h(dr.mask)
				if(dr.omask&&dr.limbo_dither)image_flip(dr.omask),image_flip_h(dr.omask)
				dr.sel_here.w=s.y,dr.sel_here.h=s.x
			}
			if(dr.limbo_dither&&sel){
				menu_separator()
				if(menu_item('Lighten Image',dr.dither_threshold>-2.0))dr.dither_threshold-=.1
				if(menu_item('Darken  Image',dr.dither_threshold< 2.0))dr.dither_threshold+=.1
			}
		}
		if(ms.type==null&&uimode=='object'){
			if(menu_item('Undo',has_undo(),'z'))undo()
			if(menu_item('Redo',has_redo(),'Z'))redo()
			menu_separator()
			if(menu_item('Cut Widgets',ob.sel.length,'x',menucut)){}
			if(menu_item('Copy Widgets',ob.sel.length,'c',menucopy)){}
			if(menu_item('Copy Image',ob.sel.length==1,0,copywidgetimg)){}
			if(menu_item('Paste',1,'v',menupaste)){}
			menu_separator()
			if(menu_item('Paste as new Canvas',1,0,pasteascanvas)){}
			if(menu_item('Paste into Canvas',ob.sel.length==1&&canvas_is(ob.sel[0]),0,pasteintocanvas)){}
			menu_separator()
			if(menu_item('Select All',1,'a'))ob.sel=con_wids().v.slice(0)
			if(menu_item('Move to Front',ob.sel.length))ob_order(),ob.sel                   .map(w=>iwrite(w,lms('index'),lmn(RTEXT_END))),mark_dirty()
			if(menu_item('Move Up'      ,ob.sel.length))ob_move_up()
			if(menu_item('Move Down'    ,ob.sel.length))ob_move_dn()
			if(menu_item('Move to Back' ,ob.sel.length))ob_order(),ob.sel.slice(0).reverse().map(w=>iwrite(w,lms('index'),NONE          )),mark_dirty()
		}
		if(wid.fv&&wid.f){
			const selection=wid.fv!=null&&wid.cursor.x!=wid.cursor.y
			menu_bar('Text',selection&&wid.f.style!='plain')
			if(wid.f.style=='rich'){
				if(menu_item('Heading'    ,selection))field_stylespan(lms('menu'),lms(''))
				if(menu_item('Body'       ,selection))field_stylespan(lms(''    ),lms(''))
				if(menu_item('Fixed Width',selection))field_stylespan(lms('mono'),lms(''))
				if(menu_item('Link...'    ,selection))modal_push('link')
			}
			else if(wid.f.style=='code'){
				if(menu_item('Indent'        ,1    ))field_indent(1)
				if(menu_item('Unindent'      ,1    ))field_indent(0)
				if(menu_item('Toggle Comment',1,'/'))field_comment()
			}
			if(wid.f&&wid.f.style!='code'){
				if(menu_item('Font...',wid.f.style!='plain'))modal_push('fonts')
			}
		}
	}
	if(ms.type=='recording'&&!wid.fv){
		menu_bar('Edit',au.mode=='stopped')
		if(menu_item('Undo',au.hist_cursor>0             ,'z'))sound_undo()
		if(menu_item('Redo',au.hist_cursor<au.hist.length,'Z'))sound_redo()
		menu_separator()
		if(menu_item('Cut Sound'  ,1,'x',menucut)){}
		if(menu_item('Copy Sound' ,1,'c',menucopy)){}
		if(menu_item('Paste Sound',1,'v',menupaste)){}
		if(menu_item('Clear',1,0))sound_delete()
		menu_separator()
		if(menu_item('Select All',1,'a'))au.head=0,au.sel=rect(0,au.target.data.length-1)
	}
	if((uimode=='interact'||uimode=='draw'||uimode=='object')&&card_is(con())){
		menu_bar('Card',ms.type==null&&!kc.on)
		if(menu_item('Go to First'   ,1))n_go([lms('First')],deck)
		if(menu_item('Go to Previous',1))n_go([lms('Prev' )],deck)
		if(menu_item('Go to Next'    ,1))n_go([lms('Next' )],deck)
		if(menu_item('Go to Last'    ,1))n_go([lms('Last' )],deck)
		if(menu_item('Go Back',deck.history.length>1))n_go([lms('Back')],deck)
		menu_separator()
		if(menu_item('Cut Card',1,0,cutcard)){}
		if(menu_item('Copy Card',1,0,copycard)){}
		menu_separator()
		if(menu_item('Script...'    ,1))setscript(con())
		if(menu_item('Properties...',1))modal_enter('card_props')
	}
	if((uimode=='interact'||uimode=='draw'||uimode=='object')&&prototype_is(con())){
		menu_bar('Prototype',ms.type==null&&!kc.on)
		const def=con(), defs=deck.contraptions
		if(menu_item('Close',1))con_set(null)
		if(menu_item('Go to Previous',count(defs)>1)){ev.dir='left' ,tracking(),ev.dir=0}
		if(menu_item('Go to Next'    ,count(defs)>1)){ev.dir='right',tracking(),ev.dir=0}
		menu_separator()
		if(menu_item('Script...'    ,1))setscript(con())
		if(menu_item('Properties...',1))modal_enter('prototype_props')
		if(menu_item('Attributes...',1))modal_enter('prototype_attrs')
		if(menu_check('Show Margins',1,ob.show_margins))ob.show_margins^=1
		menu_separator()
		let r=lb(ifield(def,'resizable'))
		if(menu_check('Resizable',1,r,0)){r^=1,iwrite(def,lms('resizable'),lmn(r)),mark_dirty()}
	}
	if(uimode=='interact'||uimode=='draw'||uimode=='object'){
		menu_bar('Tool',ms.type==null&&!kc.on)
		if(menu_check('Interact',1,uimode=='interact',0))setmode('interact')
		if(menu_check('Widgets' ,1,uimode=='object'  ,0))setmode('object')
		menu_separator()
		if(menu_check('Select'     ,1,uimode=='draw'&&dr.tool=='select'     ))settool('select'     )
		if(menu_check('Lasso'      ,1,uimode=='draw'&&dr.tool=='lasso'      ))settool('lasso'      )
		if(menu_check('Pencil'     ,1,uimode=='draw'&&dr.tool=='pencil'     ))settool('pencil'     )
		if(menu_check('Line'       ,1,uimode=='draw'&&dr.tool=='line'       ))settool('line'       )
		if(menu_check('Flood'      ,1,uimode=='draw'&&dr.tool=='fill'       ))settool('fill'       )
		if(menu_check('Box'        ,1,uimode=='draw'&&dr.tool=='rect'       ))settool('rect'       )
		if(menu_check('Filled Box' ,1,uimode=='draw'&&dr.tool=='fillrect'   ))settool('fillrect'   )
		if(menu_check('Oval'       ,1,uimode=='draw'&&dr.tool=='ellipse'    ))settool('ellipse'    )
		if(menu_check('Filled Oval',1,uimode=='draw'&&dr.tool=='fillellipse'))settool('fillellipse')
		if(menu_check('Polygon'    ,1,uimode=='draw'&&dr.tool=='poly'       ))settool('poly'       )
	}
	if(uimode=='draw'||uimode=='object'){
		menu_bar('View',ms.type==null&&!kc.on)
		if(menu_check('Show Widgets'         ,1,dr.show_widgets))dr.show_widgets^=1
		if(menu_check('Show Widget Bounds'   ,1,ob.show_bounds ))ob.show_bounds ^=1
		if(menu_check('Show Widget Names'    ,1,ob.show_names  ))ob.show_names  ^=1
		if(menu_check('Show Cursor Info'     ,1,ob.show_cursor ))ob.show_cursor ^=1
		if(menu_check('Show Alignment Guides',1,ob.show_guides ))ob.show_guides ^=1
		menu_separator()
		if(menu_check('Show Grid Overlay',1,dr.show_grid))dr.show_grid^=1
		if(menu_check('Snap to Grid'     ,1,dr.snap     ))dr.snap     ^=1
		if(menu_item('Grid and Scale...',1))modal_enter('grid')
		menu_separator()
		if(menu_check('Show Animation'   ,1,dr.show_anim ))dr.show_anim ^=1
		if(menu_check('Transparency Mask',1,dr.trans_mask))dr.trans_mask^=1
		if(menu_check('Fat Bits'         ,1,dr.fatbits   )){
			if(ms.type==null&&uimode!='draw')setmode('draw')
			dr.fatbits^=1;if(dr.fatbits)center_fatbits(rcenter(bg_has_sel()||bg_has_lasso()?dr.sel_here:con_dim(),rect()))
		}
	}
	if(uimode=='draw'){
		menu_bar('Style',ms.type==null&&!kc.on)
		if(menu_item('Stroke...',1))modal_enter('pattern')
		if(menu_item('Fill...'  ,1))modal_enter('fill'   )
		if(menu_item('Brush...' ,1))modal_enter('brush'  )
		menu_separator()
		if(menu_check('Color'       ,1,dr.color))dr.color^=1
		if(menu_check('Transparency',1,dr.trans))dr.trans^=1
		if(menu_check('Underpaint'  ,1,dr.under))dr.under^=1
	}
	if(uimode=='object'){
		menu_bar('Widgets',ms.type==null)
		if(menu_item('New Button...'     ,1))ob_create([lmd([lms('type')],[lms('button')])])
		if(menu_item('New Field...'      ,1))ob_create([lmd([lms('type')],[lms('field' )])])
		if(menu_item('New Slider...'     ,1))ob_create([lmd([lms('type')],[lms('slider')])])
		if(menu_item('New Canvas...'     ,1))ob_create([lmd([lms('type')],[lms('canvas')])])
		if(menu_item('New Grid...'       ,1))ob_create([lmd([lms('type')],[lms('grid'  )])])
		if(card_is(con())&&menu_item('New Contraption...',1))modal_enter('pick_contraption')
		menu_separator()
		if(menu_item('Order...'   ,count(ifield(con(),'widgets'))))modal_enter('orderwids')
		menu_separator()
		let al=1,aa=1,av=1,as=1,at=1,ai=1,an=1
		ob.sel.map(unpack_widget).map(w=>{al&=w.locked, as&=w.show=='solid', at&=w.show=='transparent', ai&=w.show=='invert', an&=w.show=='none'})
		ob.sel.map(w=>aa&=lb(ifield(w,'animated')))
		ob.sel.map(w=>av&=lb(ifield(w,'volatile')))
		if(menu_check('Locked'          ,ob.sel.length,ob.sel.length&&al))ob_edit_prop('locked'  ,lmn(!al))
		if(menu_check('Animated'        ,ob.sel.length,ob.sel.length&&aa))ob_edit_prop('animated',lmn(!aa))
		if(menu_check('Volatile'        ,ob.sel.length,ob.sel.length&&av))ob_edit_prop('volatile',lmn(!av))
		menu_separator()
		if(menu_check('Show Solid'      ,ob.sel.length,ob.sel.length&&as))ob_edit_prop('show',lms('solid'      ))
		if(menu_check('Show Transparent',ob.sel.length,ob.sel.length&&at))ob_edit_prop('show',lms('transparent'))
		if(menu_check('Show Inverted'   ,ob.sel.length,ob.sel.length&&ai))ob_edit_prop('show',lms('invert'     ))
		if(menu_check('Show None'       ,ob.sel.length,ob.sel.length&&an))ob_edit_prop('show',lms('none'       ))
		menu_separator()
		if(menu_item('Font...'  ,ob.sel.length))modal_enter('fonts')
		if(menu_item('Script...',ob.sel.length)){
			if(ob.sel.reduce((m,v)=>m&&ob.sel[0].script==v.script,1)){setscript(ob.sel)}else{
				modal_enter('multiscript')
					ms.message=lms('Not all of the selected widgets\nhave the same script.\nEdit them all together anyway?')
					ms.verb=lms('Edit')
			}
		}
		if(menu_item('Properties...',ob.sel.length==1)||(ob.sel.length==1&&ev.action&&ms.type==null))object_properties(ob.sel[0])
	}
	if(ms.type=='listen'){
		menu_bar('Listener',1)
		if(menu_item('Clear History',1))li.hist=[],li.scroll=0
		if(menu_item('Clear Locals' ,1))li.vars=new Map()
		menu_separator()
		if(menu_item('Show Locals',1)){
			const loc=lmd();for(let k of li.vars.keys())dset(loc,lms(k),li.vars.get(k))
			listen_show(ALIGN.right,0,loc)
		}
		menu_separator()
		if(menu_item('Evaluate',rtext_len(ms.text.table)))listener_eval()
	}
	menu_bar('Help',1)
	if(menu_item('Decker Website...'  ,1))n_go([lms('http://beyondloom.com/decker/index.html'          )],deck)
	if(menu_item('Decker Community...',1))n_go([lms('https://internet-janitor.itch.io/decker/community')],deck)
	if(menu_item('Decker Reference...',1))n_go([lms('http://beyondloom.com/decker/decker.html'         )],deck)
	if(menu_item('Lil Reference...'   ,1))n_go([lms('http://beyondloom.com/decker/lil.html'            )],deck)
}

export const main_view=_=>{
	if(in_layer()&&uimode=='object'&&ob.sel.length==0)tracking()
	const back=con_image(), wids=con_wids(), pal=deck.patterns.pal.pix
	if(ms.type!='trans'){
		const cl=con_clip(),s=con_size()
		if(back.size.x!=s.x||back.size.y!=s.y)image_resize(back,s),mark_dirty()
		if(dr.fatbits){frame.image.pix.fill(46),draw_rect(cl,dr.trans_mask?45:32),draw_fat(cl,back,pal,frame_count,0,dr.zoom,dr.offset)}
		else if(s.x==frame.size.x&&s.y==frame.size.y){for(let z=0;z<back.pix.length;z++)frame.image.pix[z]=back.pix[z]}
		else{frame.image.pix.fill(46),draw_rect(cl,dr.trans_mask?45:32),image_paste(cl,frame.clip,back,frame.image,0)}
	}
	ev=ev_to_con(ev)
	if(uimode=='draw'&&in_layer())bg_tools()
	if(dr.tool=='select'&&(dr.sel_start.w>0||dr.sel_start.h>0))draw_rect(con_to_screen(dr.sel_start),dr.fill)
	bg_lasso_preview()
	const livesel=bg_select()
	ev=con_to_ev(ev)
	if(((uimode=='object'||uimode=='draw')&&dr.show_grid)||ms.type=='grid'){
		const c=con_dim()
		if(dr.fatbits){
			for(let x=dr.grid_size.x;x<c.w;x+=dr.grid_size.x){const r=con_to_screen(rect(c.x+x,c.y,1,c.h));draw_vline(r.x,r.y,r.y+r.h,44)}
			for(let y=dr.grid_size.y;y<c.h;y+=dr.grid_size.y){const r=con_to_screen(rect(c.x,c.y+y,c.w,1));draw_hline(r.x,r.x+r.w,r.y,44)}
		}
		else{
			for(let x=dr.grid_size.x;x<c.w;x+=dr.grid_size.x)for(let y=dr.grid_size.y;y<c.h;y+=dr.grid_size.y){
				const r=con_to_screen(rect(x,y));draw_rect(rect(r.x,r.y,1,1),44)
			}
		}
	}
	if(uimode=='object'&&ob.show_guides&&ob.sel.length){
		const b=ob.sel.map(w=>con_to_screen(unpack_widget(w).size)).reduce(runion)
		wids.v.filter(w=>!ob.sel.some(x=>x==w)).map(w=>{
			const a=con_to_screen(unpack_widget(w).size), u=runion(a,b)
			if(b.y    ==a.y    )draw_hline(u.x,u.x+u.w,u.y    ,13) // top-top
			if(b.y+b.h==a.y+a.h)draw_hline(u.x,u.x+u.w,u.y+u.h,13) // bottom-bottom
			if(b.x    ==a.x    )draw_vline(u.x    ,u.y,u.y+u.h,13) // left-left
			if(b.x+b.w==a.x+a.w)draw_vline(u.x+u.w,u.y,u.y+u.h,13) // right-right
			if(b.y    ==a.y+a.h)draw_hline(u.x,u.x+u.w,b.y    ,13) // top-bottom
			if(b.y+b.h==a.y    )draw_hline(u.x,u.x+u.w,a.y    ,13) // bottom-top
			if(b.x    ==a.x+a.w)draw_vline(b.x,u.y,u.y+u.h    ,13) // left-right
			if(b.x+b.w==a.x    )draw_vline(a.x,u.y,u.y+u.h    ,13) // right-left
		})
	}
	const eb=ev;if(uimode!='interact')ev=event_state()
	if(uimode=='interact'||(dr.show_widgets&&!dr.fatbits)){handle_widgets(wids,con_offset())}
	else if(dr.show_widgets&&dr.fatbits)wids.v.map(w=>{draw_boxinv(pal,con_to_screen(unpack_widget(w).size))})
	ev=eb
	const resizing=prototype_size_editor()
	if(uimode=='draw'){if(bg_has_sel())draw_handles(con_to_screen(livesel));draw_box(con_to_screen(livesel),0,ANTS)}
	if(wid.pending_grid_edit){wid.pending_grid_edit=0;modal_enter('gridcell')}
	if(uimode=='object'&&!resizing)ev=ev_to_con(ev),object_editor(),ev=con_to_ev(ev)
	if((uimode=='object'&&ob.show_names)||(uimode=='draw'&&dr.show_widgets&&dr.fatbits)||ms.type=='listen'){
		wids.v.map(wid=>{
			const size=con_to_screen(unpack_widget(wid).size)
			const n=ls(ifield(wid,'name')),s=font_textsize(FONT_BODY,n)
			draw_text_outlined(rect(size.x,size.y-s.y,s.x,s.y),n,FONT_BODY)
		})
	}
	if(ob.show_cursor&&ms.type==null&&({draw:1,object:1})[uimode]){
		ev=ev_to_con(ev);
		const cursor=(x,r)=>{
			const t=ls(dyad.format(lms(x),lml([r.x,r.y,r.w,r.h].map(lmn)))),s=font_textsize(FONT_BODY,t)
			draw_text_outlined(rsub(con_to_screen(rpair(ev.pos,s)),rect(0,s.y)),t,FONT_BODY)
		}
		if(uimode=='draw'&&bg_has_sel())                  {cursor('(%3i,%3i,%3i,%3i)',livesel)}
		else if(uimode=='object'&&ev.drag&&is_resizable()){cursor('(%3i,%3i,%3i,%3i)',unpack_widget(ob.sel[0]).size)}
		else if(ev.drag){const a=ev.dpos,b=ev.pos;         cursor('(%3i,%3i,%3i,%3i)',rpair(b,rsub(b,a)))}
		else                                              {cursor('(%3i,%3i)',ev.pos)}
		ev=con_to_ev(ev);
	}
	if(in_layer()&&ev.exit&&!dr.fatbits&&!card_is(con()))con_set(null),ev.exit=0
}
export const gestures=_=>{
	if(!enable_touch||!card_is(con()))return
	if(!in_layer()||uimode!='interact'||(!ev.drag&&!ev.mu))return          // must be in the right state of mind
	if(ev.drag&&ob.sel.length&&lb(ifield(ob.sel[0],'draggable')))return    // must not be dragging a canvas
	if(con_wids().v.some(x=>dover(unpack_widget(x).size)))return           // must touch grass
	const d=rsub(ev.pos,ev.dpos);if(Math.sqrt(d.x*d.x+d.y*d.y)<50)return   // must be emphatic
	if(Math.abs(d.x)<2*Math.abs(d.y)&&Math.abs(d.y)<2*Math.abs(d.x))return // must be highly directional
	const dir=Math.abs(d.x)>2*Math.abs(d.y)?(d.x<0?'left':'right'):(d.y<0?'up':'down')
	image_paste(rect(ev.pos.x-8,ev.pos.y-8,16,16),frame.clip,GESTURES[dir],frame.image,0)
	if(ev.mu)msg.target_navigate=con(),msg.arg_navigate=lms(dir)
}

export const validate_modules=_=>{
	for(let z=0;z<count(deck.modules);z++){
		const err=ifield(deck.modules.v[z],'error');if(!count(err))continue
		modal_enter('alert'),ms.message=rtext_cast(lms(`The module "${ls(deck.modules.k[z])}" failed to initialize: ${ls(err)}`));break
	}
}
export const load_deck=d=>{
	deck=d, dirty=0, wid.active=-1, wid.hist=[], au.hist=[], doc_hist=[], doc_hist_cursor=0, dr=draw_state(), con_set(null)
	FONT_BODY=dget(deck.fonts,lms('#decker_root')),FONT_MENU=dget(deck.fonts,lms('menu')),FONT_MONO=dget(deck.fonts,lms('mono'))
	fb=image_make(getpair(ifield(ifield(deck,'card'),'size'))),context=frame=draw_frame(fb),validate_modules(),setmode('interact'),msg.next_view=1
	seed=0|(new Date().getTime()/1000),n_play([NONE,lms('loop')])
}
export const tick=_=>{
	pointer.up=ev.mu,pointer.down=ev.md,toolbars()
	msg.pending_drag=0,msg.pending_halt=0,frame=context,uicursor=0,fb.pix.fill(0)
	menu_setup(),all_menus(),widget_setup()
	const ev_stash=ev;kc.heading=null;if(kc.on)ev=event_state()
	if(uimode=='script'){const mh=3+font_h(FONT_MENU);if(!kc.on)script_editor(rect(0,mh,frame.size.x+1,frame.size.y-mh))}else{main_view()}
	modals(),gestures()
	if(kc.on){ev=ev_stash,keycaps()}
	if(uimode=='script'&&enable_touch&&ms.type==null)wid.active=0
	menu_finish()
	if(uimode=='draw'&&dr.fatbits&&!ev.hidemenu)draw_icon(rect(frame.size.x-14,2),ZOOM,1)
	if(uimode=='interact'&&ev.drag&&ob.sel.length&&lb(ifield(ob.sel[0],'draggable'))){
		const c=ob.sel[0].card, off=(contraption_is(c)||prototype_is(c))?getpair(ifield(c,'pos')):rect(0,0)
		iwrite(ob.sel[0],lms('pos'),lmpair(rsub(rsub(ev.pos,ob.prev),off))),mark_dirty()
	}
	q('#display').style.cursor=uicursor||'default'
	document.title=ls(ifield(deck,'name')) || 'Untitled Deck'
	for(let x=0;x<=1;x++)for(let y=0;y<=1;y++)draw_icon(rect(x*(context.size.x-5),y*(context.size.y-5)),CORNERS[x+y*2],1)
	const used=interpret()
	if(uimode=='interact'&&profiler){
		const r=rect(frame.size.x-60,2,50,12), pal=deck.patterns.pal.pix
		draw_text(inset(r,2),ls(dyad.format(lms('%0.2f%%'),lmn(100*used/FRAME_QUOTA))),FONT_BODY,1),draw_box(r,0,1)
		for(let z=0;z<r.w-2;z++){
			let v=0;for(let i=0;i<4;i++)v=max(v,profiler_hist[(profiler_ix+(4*z)+i)%profiler_hist.length])
			draw_invert(pal,rect(r.x+1+z,r.y+r.h-v,1,v-1))
		}profiler_hist[profiler_ix]=(r.h-2)*used/FRAME_QUOTA,profiler_ix=(profiler_ix+1)%profiler_hist.length
	}
	if((uimode=='object'||(uimode=='draw'&&!dr.fatbits))&&!ev.hidemenu){
		const b=rect(menu.x,1,context.size.x-menu.x-2,1+font_h(FONT_MENU))
		draw_textr(b,ls(ifield(con(),"name")),FONT_BODY,1)
	}
	if(msg.pending_loop)sfx_doloop()
	if(ui_container&&ui_container.dead)ui_container=null
	ev.shortcuts={}
	ev.mu=ev.md=ev.click=ev.dclick=ev.tab=ev.action=ev.dir=ev.exit=ev.eval=ev.scroll=ev.rdown=ev.rup=0
	if(ev.clicktime)ev.clicktime--;if(ev.clicklast)ev.clicklast--
	if(ev.pos.x!=ev.dpos.x||ev.pos.y!=ev.dpos.y)ev.clicklast=0
	wid.cursor_timer=(wid.cursor_timer+1)%(2*FIELD_CURSOR_DUTY)
	if(wid.change_timer){wid.change_timer--;if(wid.change_timer==0)field_change()}
	keyup={},pending_tick=1,frame_count++
}

let id=null
export const sync=_=>{
	pick_palette(deck)
	const anim=deck.patterns.anim, pal=deck.patterns.pal.pix, mask=dr.trans_mask&&uimode=='draw', fc=dr.show_anim?0|(frame_count/4):0
	const anim_ants   =(x,y)=>(0|((x+y+(0|(frame_count/2)))/3))%2?15:0
	const anim_pattern=(pix,x,y)=>pix<28||pix>31?pix: anim[pix-28][fc%max(1,anim[pix-28].length)]
	const draw_pattern=(pix,x,y)=>pix<2?(pix?1:0): pix>31?(pix==32?0:1): pal_pat(pal,pix,x,y)&1
	const draw_color  =(pix,x,y)=>pix==ANTS?anim_ants(x,y): pix>47?0: pix>31?pix-32: draw_pattern(pix,x,y)?15:0
	if(!id||id.width!=fb.size.x||id.height!=fb.size.y){id=new ImageData(fb.size.x,fb.size.y);id.data.fill(0xFF)}
	for(let z=0,d=0,y=0;y<id.height;y++)for(let x=0;x<id.width;x++,z++,d+=4){
		const pix=fb.pix[z], a=anim_pattern(pix,x,y), c=(a==0&&mask)?13:draw_color(a,x,y), cv=COLORS[c]
		id.data[d  ]=0xFF&(cv>>16)
		id.data[d+1]=0xFF&(cv>> 8)
		id.data[d+2]=0xFF&(cv    )
	}
	const r=q('#render');r.getContext('2d').putImageData(id,0,0)
	const g=q('#display').getContext('2d');g.imageSmoothingEnabled=zoom!=(0|zoom),g.save(),g.scale(zoom,zoom),g.drawImage(r,0,0),g.restore()
}

export const move=(x,y)=>{if(!msg.pending_drag)pointer.prev=pointer.pos;pointer.pos=ev.pos=rect(x,y);if(pointer.held)msg.pending_drag=1}
export const down=(x,y,alt)=>{
	ev.rawdpos=ev.rawpos,ev.down_modal=ms.type,ev.down_uimode=uimode,ev.down_caps=kc.on
	move(x,y),pointer.held=ev.drag=1;pointer.start=ev.dpos=pointer.pos,ev.md=1,ev.clicktime=10;if(alt)ev.rdown=1;initaudio()}
export const up=(x,y,alt)=>{
	move(x,y),pointer.held=ev.drag=0,pointer.end=pointer.pos,ev.mu=1;if(alt)ev.rup=1
	if(ev.clicktime)ev.click=1;ev.clicktime=0;if(ev.clicklast)ev.dclick=1;ev.clicklast=DOUBLE_CLICK_DELAY
	if(ev.callback&&ev.callback_rect&&over(ev.callback_rect)&&(ev.callback_drag||dover(ev.callback_rect)))ev.callback()
	ev.callback=null,ev.callback_rect=null,ev.callback_drag=0;if(audio)audio.resume()
}
export const mouse=(e,f)=>{
	ev.rawpos=rect(e.pageX,e.pageY);const c=q('#display').getBoundingClientRect()
	f(0|((e.pageX-c.x)/zoom),0|((e.pageY-c.y)/zoom),e.button!=0)
}
export const touch=(e,f)=>{const t=e.targetTouches[0]||{}; mouse({pageX:t.clientX, pageY:t.clientY, button:0},f);if(!set_touch)enable_touch=1}
let prev_stamp=null, leftover=0
export const loop=stamp=>{
	if(!prev_stamp)prev_stamp=stamp
	let delta=(stamp-prev_stamp)+leftover, frame=1000/60, tc=0
	while(delta>frame){tick(),tc++,delta-=frame;if(tc==5){delta=0;break}};leftover=delta
	sync(),prev_stamp=stamp,requestAnimationFrame(loop)
	if(do_panic)setmode('object');do_panic=0
}
export const resize=_=>{
	const b=q('#decker_root'), screen=rect(b.clientWidth,b.clientHeight), fs=min(screen.x/fb.size.x,screen.y/fb.size.y)
	zoom=max(1,is_fullscreen()?fs:(0|fs))
	tzoom=0|min((screen.x-(zoom*fb.size.x))/(2*toolsize.x),screen.y/toolsize.y)
	const tz=tzoom*toolbars_enable
	const c =q('#display');c .width=fb.size .x*zoom,c.height =fb.size .y*zoom
	const tl=q('#ltools' );tl.width=toolsize.x*tz  ,tl.height=toolsize.y*tz
	const tr=q('#rtools' );tr.width=toolsize.x*tz  ,tr.height=toolsize.y*tz
	const r =q('#render' );r .width=fb.size .x     ,r .height=fb.size .y
	const rl=q('#lrender');rl.width=toolsize.x     ,rl.height=toolsize.y
	const rr=q('#rrender');rr.width=toolsize.x     ,rr.height=toolsize.y
}
window.onresize=_=>{resize(),sync()}
q('#decker_root').addEventListener('mousedown'  ,e=>mouse(e,down))
q('#decker_root').addEventListener('mouseup'    ,e=>mouse(e,up  ))
q('#decker_root').addEventListener('mousemove'  ,e=>mouse(e,move))
q('#decker_root').addEventListener('contextmenu',e=>e.preventDefault())
q('#decker_root').addEventListener('touchstart' ,e=>{e.preventDefault(),touch(e,down)},{passive:false})
q('#decker_root').addEventListener('touchend'   ,e=>touch({targetTouches:e.changedTouches},up))
q('#decker_root').addEventListener('touchmove'  ,e=>touch(e,move))
q('#decker_root').onwheel=e=>ev.scroll=e.deltaY<0?-1:e.deltaY>0?1:0
q('#decker_root').onkeydown=e=>{
	initaudio()
	keydown[e.key]=1
	if(e.shiftKey)ev.shift=1
	if(e.key=='ArrowUp'   )ev.dir='up'
	if(e.key=='ArrowDown' )ev.dir='down'
	if(e.key=='ArrowLeft' )ev.dir='left'
	if(e.key=='ArrowRight')ev.dir='right'
	if(e.metaKey||e.ctrlKey)ev.alt=1,ev.shortcuts[e.shiftKey?(e.key.toUpperCase()):e.key]=1
	else if(e.key.length==1&&wid.infield)field_input(e.key)
	else if(uimode=='draw'&&ms.type==null){if(e.key=='Backspace'||e.key=='Delete')bg_delete_selection()}
	else if(uimode=='object'&&ms.type==null){
		if(e.key=='[')ob_move_dn()
		if(e.key==']')ob_move_up()
		if(e.key=='Backspace'||e.key=='Delete')ob_destroy()
	}
	else if(ms.type=='recording'&&!wid.infield&&au.mode=='stopped'){if(e.key=='Backspace'||e.key=='Delete')sound_delete()}
	if(e.key=='Enter')ev.action=1
	if     (wid.ingrid )grid_keys (e.key,e.shiftKey)
	else if(wid.infield)field_keys(e.key,e.shiftKey)
	if(uimode=='script')sc.status=''
	if(e.key==' '&&!wid.infield)ev.action=1
	if(e.key=='Tab')ev.tab=1
	if(e.key=='L'&&ms.type==null&&!wid.ingrid&&!wid.infield)ev.shortcuts['l']=1
	if(e.key=='f'&&ms.type==null&&!wid.ingrid&&!wid.infield)toggle_fullscreen
	if(e.key=='j'&&ms.type==null&&dr.limbo_dither&&dr.dither_threshold>-2.0)dr.dither_threshold-=.1
	if(e.key=='k'&&ms.type==null&&dr.limbo_dither&&dr.dither_threshold< 2.0)dr.dither_threshold+=.1
	if((e.metaKey||e.ctrlKey)&&({c:1,x:1,v:1})[e.key]){}
	else{e.preventDefault()}
}
q('#decker_root').onkeyup=e=>{
	keydown[e.key]=0,keyup[e.key]=1
	if(e.key=='Meta'||e.key=='Control'||e.metaKey||e.ctrlKey)ev.alt=0,keydown={}
	if(e.key=='Enter'&&e.shiftKey)ev.eval=1
	if(e.key=='Shift'||e.shiftKey)ev.shift=0
	if(e.key=='m'&&uimode=='draw'&&in_layer())ev.hidemenu^=1
	if(e.key=='t'&&uimode=='draw'&&in_layer())dr.trans^=1
	if(e.key=='u'&&uimode=='draw'&&in_layer())dr.under^=1
	const brush_count=24+count(deck.brushes)
	if(e.key=='9'&&uimode=='draw'&&ms.type==null)dr.brush=max(            0,dr.brush-1)
	if(e.key=='0'&&uimode=='draw'&&ms.type==null)dr.brush=min(brush_count-1,dr.brush+1)
	if(e.key=='Escape')ev.exit=1
	if(!wid.infield&&!wid.ingrid&&ms.type==null&&uimode=='interact'&&card_is(con())){
		if(e.key=='ArrowUp'   )msg.target_navigate=ifield(deck,'card'),msg.arg_navigate=lms('up'   )
		if(e.key=='ArrowDown' )msg.target_navigate=ifield(deck,'card'),msg.arg_navigate=lms('down' )
		if(e.key=='ArrowLeft' )msg.target_navigate=ifield(deck,'card'),msg.arg_navigate=lms('left' )
		if(e.key=='ArrowRight')msg.target_navigate=ifield(deck,'card'),msg.arg_navigate=lms('right')
	}
	e.preventDefault()
}
q('#decker_root').onblur=e=>{ev.alt=0,keydown={}}
let local_clipboard=''
export const getclipboard=after=>{
	const t=document.createElement('textarea');t.style.top='0',t.style.left='0',t.position='fixed',t.onpaste=e=>{e.stopPropagation()}
	document.body.appendChild(t),t.focus(),t.select();const success=document.execCommand('paste');const x=t.value;document.body.removeChild(t)
	if(success){after(x);return}                                       // this approach seems to work fine for Safari
	try{navigator.clipboard.readText().then(text=>{after(text)},_=>_)} // this works in Chrome, but *explicitly* does not work in Firefox
	catch(e){after(local_clipboard)}                                   // so Firefox gets to use a baby-jail local clipboard
}
export const setclipboard=x=>{
	local_clipboard=x
	const t=document.createElement('textarea');t.value=x,t.style.top='0',t.style.left='0',t.position='fixed',t.oncopy=e=>{e.stopPropagation()}
	document.body.appendChild(t),t.focus(),t.select();const success=document.execCommand('copy');document.body.removeChild(t);if(success)return;
	try{navigator.clipboard.writeText(x).then(_=>_,_=>_)}catch(e){console.log(e)} // generally not necessary, but worth having as a last resort
}
export const docut=_=>{
	if(wid.fv){
		const s=rtext_span(wid.fv.table,wid.cursor),i=rtext_is_image(s);field_keys('Delete',0)
		return i?image_write(i):ls(rtext_string(s))
	}
	else if(ms.type=='recording'&&au.mode=='stopped'){const r=sound_write(sound_selected());sound_delete();return r}
	else if(ms.type==null&&uimode=='draw'&&(bg_has_sel()||bg_has_lasso())){
		const i=bg_has_lasso()?image_mask(dr.limbo,dr.mask): dr.limbo?bg_scaled_limbo():bg_copy_selection(dr.sel_here)
		bg_scoop_selection(),bg_delete_selection();return image_write(i)
	}
	else if(ms.type==null&&uimode=='object'&&ob.sel.length){ob_order();const r=ls(con_copy(con(),lml(ob.sel)));ob_destroy();return r}
	return null
}
export const docopy=_=>{
	if(wid.gv){return ls(n_writecsv([wid.gv.table,grid_format()]))}
	else if(wid.fv){
		const s=rtext_span(wid.fv.table,wid.cursor),i=rtext_is_image(s)
		return i?image_write(i):ls(rtext_string(s))
	}
	else if(ms.type=='recording'&&au.mode=='stopped'){return sound_write(sound_selected())}
	else if(ms.type==null&&uimode=='draw'&&(bg_has_sel()||bg_has_lasso())){
		const i=bg_has_lasso()?image_mask(dr.limbo,dr.mask): dr.limbo?bg_scaled_limbo():bg_copy_selection(dr.sel_here);return image_write(i)
	}
	else if(ms.type==null&&uimode=='object'&&ob.sel.length){ob_order();return ls(con_copy(con(),lml(ob.sel)))}
	return null
}
export const dopaste=x=>{
	if((ms.type==null||(ms.type=='contraption_props'&&wid.fv))&&/^%%IMG[012]/.test(x)){
		const i=image_read(x);if(i.size.x==0||i.size.y==0)return
		if(wid.fv){
			if(wid.f.style!='rich'){field_input(x)}
			else{field_edit(lms(''),i,'i',wid.cursor)}
		}else{setmode('draw'),bg_paste(i,0)}
	}
	else if(ms.type=='recording'&&au.mode=='stopped'&&/^%%SND0/.test(x)){sound_edit(sound_replace(sound_read(x)))}
	else if(ms.type==null&&/^%%WGT0/.test(x)){
		const v=pjson(x,6,x.length-6).value; let defs=dget(v,lms('d')),wids=dget(v,lms('w'));wids=wids?ll(wids):[]
		merge_fonts(deck,dget(v,lms('f'))),merge_prototypes(deck,defs?ld(defs):lmd(),wids),ob_create(wids)
	}
	else if(ms.type==null&&/^%%CRD0/.test(x)){
		const c=deck_paste(deck,lms(x));con_set(null)
		const card=ifield(deck,'card'), n=ln(ifield(card,'index'));iwrite(c,lms('index'),lmn(n+1)),n_go([c],deck)
	}
	else if(/^%%RTX0/.test(x)){
		if(wid.fv){
			const t=rtext_decode(x)
			if(wid.f.style=='rich'){field_editr(t,wid.cursor)}
			else{field_input(ls(rtext_string(t)))}
		}
	}
	else if(wid.gv&&!wid.g.locked&&ms.type==null){grid_edit(n_readcsv([lms(x),lms(wid.g.format)]))}
	else if(wid.fv){field_input(x)}
}
export const cutcard=_=>{const c=ifield(deck,'card');setclipboard(ls(deck_copy(deck,c))),deck_remove(deck,c),mark_dirty()}
export const copycard=_=>{const c=ifield(deck,'card');setclipboard(ls(deck_copy(deck,c)))}
export const copywidgetimg=_=>{setclipboard(image_write(draw_widget(ob.sel[0]))),frame=context}
export const pasteascanvas=_=>getclipboard(t=>{ob_create([lmd(['type','locked','image','border'].map(lms),[lms('canvas'),ONE,lms(t),NONE])]),frame=context})
export const pasteintocanvas=_=>getclipboard(t=>{const i=image_read(t),c=ob.sel[0];iwrite(c,lms('size'),ifield(i,'size')),c.image=i})
export const menucut=_=>{const r=docut();if(r)setclipboard(r)}
export const menucopy=_=>{const r=docopy();if(r)setclipboard(r)}
export const menucopyrich=_=>{setclipboard(rtext_encode(rtext_span(wid.fv.table,wid.cursor)))}
export const menupaste=_=>getclipboard(t=>{if(t.length)dopaste(t)})
document.oncut=e=>{const r=docut();if(r)e.clipboardData.setData('text/plain',r),local_clipboard=r;e.preventDefault()}
document.oncopy=e=>{const r=docopy();if(r)e.clipboardData.setData('text/plain',r),local_clipboard=r;e.preventDefault()}
document.onpaste=e=>{
	const src=e.clipboardData||e.originalEvent.clipboardData
	if(src.items[0]){
		const file=src.items[0].getAsFile()
		if(file&&/^image\//.test(file.type)){load_image(file);return}
		if(file&&/^audio\//.test(file.type)){load_sound(file);return}
	}
	dopaste(src.getData('text/plain')),e.preventDefault()
}
q('#decker_root').ondragover=e=>e.preventDefault()
q('#decker_root').ondrop=e=>{
	e.preventDefault();const file=e.dataTransfer.files.item(0);if((!file)||lb(ifield(deck,'locked')))return
	if(/\.(psv|csv)$/i.test(file.name)){
		file.text().then(t=>{
			const data=n_readcsv([lms(t),NONE,lms(file.type=='text/csv'?',':'|')])
			setmode('object'),ob_create([lmd([lms('type'),lms('value')],[lms('grid'),monad.cols(data)])])
		})
	}
	if(/\.(html|deck)$/i.test(file.name)){
		file.text().then(t=>{
			modal_enter('resources'),ms.message=deck_read(t),ms.grid=gridtab(res_enumerate(ms.message))
		})
	}
	if(/\.hex$/i.test(file.name)){
		file.text().then(t=>{
			const color_dist=(a,b)=>{
				const dr=(0xFF&(a>>16))-(0xFF&(b>>16))
				const dg=(0xFF&(a>> 8))-(0xFF&(b>> 8))
				const db=(0xFF&(a    ))-(0xFF&(b    ))
				return (dr*dr)+(dg*dg)+(db*db)
			}
			iwrite(deck.patterns,lmn(32),lmn(0xFFFFFF)),iwrite(deck.patterns,lmn(47),NONE)
			let pal=ll(dyad.parse(lms('%h'),lml(t.split('\n').slice(0,-1).map(lms))))
			if(pal.length>14){
				let a=0,b=0;pal.map((v,i)=>{
					if(color_dist(ln(v),0x000000)<color_dist(ln(pal[a]),0x000000))a=i
					if(color_dist(ln(v),0xFFFFFF)<color_dist(ln(pal[b]),0xFFFFFF))b=i
				})
				iwrite(deck.patterns,lmn(47),pal[a]),iwrite(deck.patterns,lmn(32),pal[b])
				pal=pal.filter((_,i)=>i!=a&&i!=b)
			}for(let z=0;z<15&&z<pal.length;z++)iwrite(deck.patterns,lmn(33+z),pal[z])
		})
	}
	if(/^image\//.test(file.type)){load_image(file)}
	if(/^audio\//.test(file.type)){load_sound(file)}
}

pushstate(lmenv()),load_deck(deck_read(q('script[language="decker"]').innerText))
const tag=decodeURI(document.URL.split('#')[1]||'');if(tag.length)iwrite(deck,lms('card'),lms(tag))
resize(),requestAnimationFrame(loop)
