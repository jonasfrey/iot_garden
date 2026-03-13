// in data structures what is it called when data is present like this
// its called: 'normallized' 
let o_student = {
    n_id: 1, 
    s_name: "Gretel"
}
let o_course = {
    n_id: 1,
    s_name: "Data Structures"
}
let o_student_o_course = {
    n_o_student_id: 1,
    n_o_course_id: 1
};


// and what is it called when data is present like this
// its called: 'denormalized'
let o_student = {
    n_id: 1,
    s_name: "Gretel",
    a_o_course: [
        {
            n_id: 1,
            s_name: "Data Structures"
        }
    ]
}

// i want a function that 