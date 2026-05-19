import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getActivePlan,
  getTasks,
  getJournals,
  exportExcel,
} from "../services/api";

import toast from "react-hot-toast";

export default function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    tasks: [],
    journals: [],
    plan: null,
  });

  const [loading, setLoading] =
    useState(true);

  const avatar =
    localStorage.getItem(
      "avatar_" + user?.id
    );

  useEffect(() => {

    const fetchData =
      async () => {

      try {

        const [
          planRes,
          journalRes,
        ] = await Promise.allSettled([
          getActivePlan(),
          getJournals(),
        ]);

        const plan =
          planRes.status ===
          "fulfilled"
            ? planRes.value.data
            : null;

        const journals =
          journalRes.status ===
          "fulfilled"
            ? journalRes.value.data
            : [];

        let tasks = [];

        if (plan) {

          const taskRes =
            await getTasks(
              plan.id
            ).catch(() => ({
              data:[]
            }));

          tasks =
            taskRes.data;

        }

        setStats({
          tasks,
          journals,
          plan,
        });

      } catch(err){

        console.log(err);

      } finally {

        setLoading(false);

      }

    };

    fetchData();

  },[]);

  const handleExport =
    async()=>{

      try{

        const res =
          await exportExcel();

        const url =
          window.URL.createObjectURL(
            new Blob(
              [res.data]
            )
          );

        const link =
          document.createElement(
            "a"
          );

        link.href=url;

        link.setAttribute(
          "download",
          `BeProductive_${user?.username}.xlsx`
        );

        document.body.appendChild(
          link
        );

        link.click();

        link.remove();

        toast.success(
          "Report exported"
        );

      }catch{

        toast.error(
          "Export failed"
        );

      }

    };

  const completedTasks =
    stats.tasks.filter(
      t =>
      t.status ===
      "completed"
    ).length;

  const avgScore =
    stats.journals.length
      ? (
        stats.journals.reduce(
          (
            total,
            j
          )=>
          total+
          (
            j.productivity_score ||
            0
          ),
          0
        )
        /
        stats.journals.length
      ).toFixed(1)
      : 0;

  const cards = [

    {
      title:"Plan",
      value:
      stats.plan
      ? "Active"
      : "None"
    },

    {
      title:"Tasks",
      value:
      stats.tasks.length
    },

    {
      title:"Completed",
      value:
      completedTasks
    },

    {
      title:"Productivity",
      value:
      `${avgScore}/10`
    }

  ];

  if(loading){

    return(
      <div style={styles.loading}>
        Loading dashboard...
      </div>
    )

  }

  return(

<div className="page-container">

<div style={styles.header}>

<div
style={
styles.userSection
}
>

{avatar ? (

<img
src={avatar}
alt=""
style={
styles.avatar
}
/>

):(

<div
style={
styles.avatarPlaceholder
}
>

{
user?.username?.[0]?.toUpperCase()
}

</div>

)}

<div>

<h1
style={
styles.title
}
>
Welcome back,
{" "}
{
user?.username
}
</h1>

<div
style={
styles.subtitle
}
>
Track your weekly progress
</div>

</div>

</div>

<button
onClick={
handleExport
}
style={
styles.exportBtn
}
>
Export Report
</button>

</div>

<div
style={
styles.grid
}
>

{cards.map(
card=>(

<div
key={
card.title
}
style={
styles.card
}
>

<div
style={
styles.cardValue
}
>
{
card.value
}
</div>

<div
style={
styles.cardTitle
}
>
{
card.title
}
</div>

</div>

)
)}

</div>

<div
style={
styles.section
}
>

<h2
style={
styles.sectionTitle
}
>
Current Tasks
</h2>

{
stats.tasks.length===0
?

<div
style={
styles.empty
}
>
No active tasks
</div>

:

stats.tasks.map(
task=>(

<div
key={
task.id
}
style={
styles.item
}
>

<div>

<div
style={
styles.taskTitle
}
>

{
task.title
}

</div>

<div
style={
styles.taskStatus
}
>

{
task.status
}

</div>

</div>

<div
style={{
color:
task.priority==="high"
?
"#ef4444"
:
task.priority==="medium"
?
"#3b82f6"
:
"#10b981"
}}

>

{
task.priority
}

</div>

</div>

)
)

}

</div>

<div
style={
styles.section
}
>

<h2
style={
styles.sectionTitle
}
>

Recent Journal Entries

</h2>

{

stats.journals.length===0

?

<div
style={
styles.empty
}
>
No journal entries
</div>

:

stats.journals
.slice(
0,
5
)
.map(
j=>(

<div
key={
j.id
}
style={
styles.item
}
>

<div>

<div
style={
styles.taskTitle
}
>
{
j.entry_date
}
</div>

<div
style={
styles.taskStatus
}
>

{
j.journal_text
?.slice(
0,
60
)
}

...

</div>

</div>

<div
style={{
color:
"#10b981"
}}
>

{
j.productivity_score
}/10

</div>

</div>

)
)

}

</div>

</div>

)

}

const styles={

loading:{
display:"flex",
justifyContent:"center",
alignItems:"center",
height:"100vh"
},

header:{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
marginBottom:40,
flexWrap:"wrap",
gap:20
},

userSection:{
display:"flex",
alignItems:"center",
gap:20
},

avatar:{
width:60,
height:60,
borderRadius:"50%",
objectFit:"cover"
},

avatarPlaceholder:{
width:60,
height:60,
borderRadius:"50%",
background:"#2563eb",
display:"flex",
justifyContent:"center",
alignItems:"center",
fontWeight:700,
fontSize:24
},

title:{
fontSize:28,
fontWeight:700
},

subtitle:{
color:"#94a3b8",
marginTop:4
},

exportBtn:{
background:"#2563eb",
border:"none",
padding:"12px 18px",
borderRadius:10,
color:"white"
},

grid:{
display:"grid",
gridTemplateColumns:
"repeat(auto-fit,minmax(200px,1fr))",
gap:20,
marginBottom:30
},

card:{
background:"#0f172a",
padding:24,
borderRadius:16,
border:"1px solid #1e293b"
},

cardValue:{
fontSize:28,
fontWeight:700,
marginBottom:10
},

cardTitle:{
color:"#94a3b8"
},

section:{
background:"#0f172a",
padding:24,
borderRadius:16,
border:"1px solid #1e293b",
marginBottom:24
},

sectionTitle:{
marginBottom:20
},

item:{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
padding:"16px",
borderRadius:12,
background:"#131b2e",
marginBottom:12
},

taskTitle:{
fontWeight:600
},

taskStatus:{
fontSize:13,
color:"#94a3b8"
},

empty:{
color:"#94a3b8",
textAlign:"center",
padding:"30px"
}

};