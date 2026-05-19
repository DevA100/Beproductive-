import { useState, useEffect } from "react";
import toast from "react-hot-toast";

import {
  getJournals,
  createJournal,
  updateJournal,
  deleteJournal,
} from "../services/api";

export default function Journal() {
  const [journals, setJournals] =
    useState([]);

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  const [editForm, setEditForm] =
    useState({});

  const [form, setForm] = useState({
    entry_date:
      new Date()
        .toISOString()
        .split("T")[0],

    journal_text: "",

    wins: "",

    challenges: "",
  });

  useEffect(() => {
    getJournals()
      .then((res) =>
        setJournals(
          res.data
        )
      )
      .catch(() => {});
  }, []);

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      let score = 5;

      const hasWins =
        form.wins.length > 0;

      const hasChallenges =
        form.challenges.length >
        0;

      const textLength =
        form.journal_text.length;

      if (
        hasWins &&
        !hasChallenges
      )
        score = 8;

      if (
        hasWins &&
        hasChallenges
      )
        score = 6;

      if (
        !hasWins &&
        hasChallenges
      )
        score = 4;

      if (
        textLength > 200
      )
        score = Math.min(
          score + 1,
          10
        );

      try {
        const res =
          await createJournal({
            ...form,
            productivity_score:
              score,
          });

        setJournals([
          res.data,
          ...journals,
        ]);

        toast.success(
          `Entry saved (${score}/10)`
        );

        setShowForm(false);

        setForm({
          entry_date:
            new Date()
              .toISOString()
              .split(
                "T"
              )[0],

          journal_text: "",

          wins: "",

          challenges: "",
        });
      } catch {
        toast.error(
          "Unable to save entry"
        );
      }
    };

  const handleEdit = (
    journal
  ) => {

    setEditingId(
      journal.id
    );

    setEditForm({

      journal_text:
        journal.journal_text ||
        "",

      wins:
        journal.wins ||
        "",

      challenges:
        journal.challenges ||
        ""

    });

  };

  const handleSaveEdit =
    async (
      entryDate
    ) => {

      try {

        const res =
          await updateJournal(
            entryDate,
            editForm
          );

        setJournals(

          journals.map(
            j=>

            j.entry_date ===
            entryDate

            ?

            res.data

            :

            j
          )

        );

        setEditingId(
          null
        );

        toast.success(
          "Entry updated"
        );

      } catch {

        toast.error(
          "Update failed"
        );

      }

    };

  const handleDelete =
    async (
      entryDate
    ) => {

      if (
        !window.confirm(
          "Delete entry?"
        )
      )
        return;

      try {

        await deleteJournal(
          entryDate
        );

        setJournals(
          journals.filter(
            j=>
            j.entry_date !==
            entryDate
          )
        );

      } catch {

        toast.error(
          "Delete failed"
        );

      }

    };

  return (

<div className="page-container">

<div style={styles.header}>

<h1 style={styles.title}>
Journal
</h1>

<button
onClick={()=>
setShowForm(
!showForm
)
}
style={
styles.primaryBtn
}
>

New Entry

</button>

</div>

{
showForm && (

<div
style={
styles.card
}
>

<form
onSubmit={
handleSubmit
}
>

<input
type="date"
value={
form.entry_date
}
onChange={(e)=>
setForm({
...form,
entry_date:
e.target.value
})
}
/>

<textarea
rows={4}
placeholder="Write your reflection..."
value={
form.journal_text
}
onChange={(e)=>
setForm({
...form,
journal_text:
e.target.value
})
}
/>

<div
style={
styles.grid
}
>

<input
placeholder="Achievements"
value={
form.wins
}
onChange={(e)=>
setForm({
...form,
wins:
e.target.value
})
}
/>

<input
placeholder="Challenges"
value={
form.challenges
}
onChange={(e)=>
setForm({
...form,
challenges:
e.target.value
})
}
/>

</div>

<button
style={
styles.primaryBtn
}
>
Save Entry
</button>

</form>

</div>

)
}

<div
style={
styles.entries
}
>

{

journals.length===0

?

<div
style={
styles.empty
}
>

No journal entries

</div>

:

journals.map(
j=>(

<div
key={
j.id
}
style={
styles.entryCard
}
>

<div
style={
styles.entryHeader
}
>

<div>

<div
style={
styles.date
}
>

{
j.entry_date
}

</div>

<div
style={{
color:
j.productivity_score>=7
?
"#10b981"
:
"#3b82f6"
}}

>

Score:
{" "}

{
j.productivity_score
}/10

</div>

</div>

<div
style={{
display:"flex",
gap:10
}}
>

<button
onClick={()=>
editingId===j.id
?
setEditingId(
null
)
:
handleEdit(
j
)
}
style={
styles.editBtn
}
>

Edit

</button>

<button
onClick={()=>
handleDelete(
j.entry_date
)
}
style={
styles.deleteBtn
}
>

Delete

</button>

</div>

</div>

{

editingId===j.id

?

<div>

<textarea
rows={3}
value={
editForm.journal_text
}
onChange={(e)=>
setEditForm({
...editForm,
journal_text:
e.target.value
})
}
/>

<input
placeholder="Achievements"
value={
editForm.wins
}
onChange={(e)=>
setEditForm({
...editForm,
wins:
e.target.value
})
}
/>

<input
placeholder="Challenges"
value={
editForm.challenges
}
onChange={(e)=>
setEditForm({
...editForm,
challenges:
e.target.value
})
}
/>

<button
onClick={()=>
handleSaveEdit(
j.entry_date
)
}
style={
styles.primaryBtn
}
>

Save

</button>

</div>

:

<div>

<p
style={
styles.text
}
>

{
j.journal_text
}

</p>

<div
style={
styles.tags
}
>

{
j.wins &&
<div
style={
styles.tagGreen
}
>
{
j.wins
}
</div>
}

{
j.challenges &&
<div
style={
styles.tagBlue
}
>
{
j.challenges
}
</div>
}

</div>

</div>

}

</div>

)
)

}

</div>

</div>

);

}

const styles={

header:{
display:"flex",
justifyContent:"space-between",
marginBottom:30,
alignItems:"center"
},

title:{
fontSize:32,
fontWeight:700
},

primaryBtn:{
background:"#2563eb",
border:"none",
padding:"12px 18px",
borderRadius:10,
color:"#fff"
},

card:{
background:"#0f172a",
padding:24,
borderRadius:16,
border:"1px solid #1e293b",
marginBottom:30
},

grid:{
display:"grid",
gridTemplateColumns:
"1fr 1fr",
gap:12,
marginTop:12
},

entries:{
display:"flex",
flexDirection:"column",
gap:20
},

entryCard:{
background:"#0f172a",
padding:24,
borderRadius:16,
border:"1px solid #1e293b"
},

entryHeader:{
display:"flex",
justifyContent:"space-between",
marginBottom:20
},

date:{
fontWeight:700,
marginBottom:5
},

text:{
color:"#94a3b8",
lineHeight:1.7
},

tags:{
display:"flex",
gap:10,
marginTop:15,
flexWrap:"wrap"
},

tagGreen:{
background:"#10b98120",
color:"#10b981",
padding:"8px 12px",
borderRadius:20
},

tagBlue:{
background:"#2563eb20",
color:"#3b82f6",
padding:"8px 12px",
borderRadius:20
},

editBtn:{
background:"#2563eb20",
border:"1px solid #2563eb",
color:"#3b82f6",
padding:"8px 12px",
borderRadius:8
},

deleteBtn:{
background:"#ef444420",
border:"1px solid #ef4444",
color:"#ef4444",
padding:"8px 12px",
borderRadius:8
},

empty:{
textAlign:"center",
padding:40,
color:"#94a3b8"
}

};