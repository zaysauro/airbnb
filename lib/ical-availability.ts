import "server-only"
export type CalendarStatus = {propertyId:string; name:string; connected:boolean; state:"ok"|"missing"|"error"; blocked:string[]; checkedAt:string|null}
function permittedIcal(input:string){
 const u=new URL(input)
 if(u.protocol!=="https:"||!["airbnb.com","www.airbnb.com","airbnb.com.br","www.airbnb.com.br"].includes(u.hostname)||!/^\/calendar\/ical\/\d+\.ics$/.test(u.pathname)||u.port||u.username||u.password)throw new Error("iCal não autorizado")
 return u.toString()
}
function utc(s:string){return Date.UTC(Number(s.slice(0,4)),Number(s.slice(4,6))-1,Number(s.slice(6,8)))}
export async function readIcal(url:string):Promise<string[]>{
 const endpoint=permittedIcal(url)
 const resp=await fetch(endpoint,{cache:"no-store",redirect:"error",signal:AbortSignal.timeout(8000)})
 if(!resp.ok)throw new Error("Fonte iCal indisponível")
 const input=await resp.text()
 if(input.length>2000000||!input.includes("BEGIN:VCALENDAR"))throw new Error("iCal inválido")
 const result=new Set<string>()
 for(const event of input.split("BEGIN:VEVENT").slice(1)){
 const from=event.match(/^DTSTART[^:]*:(\d{8})/m)?.[1],to=event.match(/^DTEND[^:]*:(\d{8})/m)?.[1]
 if(!from||!to)continue
 const a=utc(from),b=utc(to)
 if(!Number.isFinite(a)||!Number.isFinite(b)||b<=a||b-a>366*86400000)continue
 for(let t=a;t<b;t+=86400000)result.add(new Date(t).toISOString().slice(0,10))
 }
 return Array.from(result).sort()
}
export async function calendarStatus(items:{id:string;name:string;ical:string|null}[]):Promise<CalendarStatus[]>{
 return Promise.all(items.map(async p=>{
 if(!p.ical)return {propertyId:p.id,name:p.name,connected:false,state:"missing" as const,blocked:[],checkedAt:null}
 try{const blocked=await readIcal(p.ical);return {propertyId:p.id,name:p.name,connected:true,state:"ok" as const,blocked,checkedAt:new Date().toISOString()}}
 catch{return {propertyId:p.id,name:p.name,connected:true,state:"error" as const,blocked:[],checkedAt:null}}
 }))
}
