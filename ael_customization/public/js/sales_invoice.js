// =======================================================
// Sales Invoice ITEM LOGIC (LIVE BUSINESS CALCULATION)
// =======================================================
frappe.ui.form.on("Sales Invoice Item", {
        // items_add(frm, cdt, cdn) {
        //     let row = locals[cdt][cdn];
        //     row.custom_formulaa = 0;
        //     frm.refresh_field("items");
        // },

        items_add(frm, cdt, cdn) {

            let row = locals[cdt][cdn];

            if (frm.__in_paste || frm.__in_import) return;

            row.custom_formulaa = 0;
            row.rate = 0;
            row.custom_total = 0;
            row.custom_total_in_inr = 0;

            setTimeout(() => {
                toggle_custom_total_edit(frm, row);
            }, 120);

        },

        form_render(frm, cdt, cdn) {

            let row = locals[cdt][cdn];
            toggle_custom_total_edit(frm, row);

        },

        item_code(frm, cdt, cdn) {

        frappe.model.set_value(cdt, cdn, "rate", 0);
        frappe.model.set_value(cdt, cdn, "price_list_rate", 0);

        // setTimeout(() => {

            frappe.model.set_value(cdt, cdn, "rate", 0);
            frappe.model.set_value(cdt, cdn, "price_list_rate", 0);

        // }, 300);

    },

    custom_custom_rate(frm, cdt, cdn) {
        calculate_row(frm, locals[cdt][cdn]);
    },

    custom_exchange_rate(frm, cdt, cdn) {
        calculate_row(frm, locals[cdt][cdn]);
    },

    custom_formulaa(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        toggle_custom_total_edit(frm, row);
        calculate_row(frm, row);
    },

    custom_total(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (!row.custom_formulaa) {
            calculate_row(frm, row);
        }
    }
});

// function toggle_custom_total_edit(frm, row) {
//     frm.fields_dict.items.grid.toggle_enable(
//         "custom_total",
//         !row.custom_formulaa
//     );
// }
function toggle_custom_total_edit(frm, row) {

    const grid_row = frm.fields_dict.items.grid.grid_rows_by_docname[row.name];

    if (!grid_row) return;

    grid_row.set_field_property(
        "custom_total",
        "read_only",
        row.custom_formulaa ? 1 : 0
    );

}

// function recalc_item_row(frm, row) {
//     if (!row) return;

//     let mode = (frm.doc.custom_mode || "").toUpperCase();
//     let user_rate = flt(row.custom_custom_rate || 0);
//     let exchange_rate = flt(row.custom_exchange_rate || 1);

//     if (row.custom_formulaa) {
//         let value = null;

//         if (["SEA - LCL IMPORT", "SEA - LCL EXPORT"].includes(mode)) {
//             value = flt(frm.doc.custom_total_cbm || 0) * user_rate;
//         }
//         else if (["AIR - IMPORT", "AIR - EXPORT"].includes(mode)) {
//             let wt = Math.max(
//                 flt(frm.doc.custom_total_weight || 0),
//                 flt(frm.doc.custom_total_volume_weight || 0)
//             );
//             value = wt * user_rate;
//         }

//         if (value !== null) {
//             row.custom_total = value;
//         }
//     }

//     row.custom_total_value = flt(row.custom_total || 0) * exchange_rate;
//     row.custom_total_in_inr = row.custom_total_value;

//     // 🔑 ERPNext bridge
//     row.rate = row.custom_total_in_inr;

//     frm.refresh_field("items");
// }




// =======================================================
// DIMENSION LOGIC (UNCHANGED, SAFE)
// =======================================================
frappe.ui.form.on("Sales Invoice", {

    refresh(frm) {

        setTimeout(() => {

            (frm.doc.items || []).forEach(row => {
                toggle_custom_total_edit(frm, row);
            });

        }, 150);

    },

    custom_mode(frm) {
        recalc_all_items(frm);
    },

    custom_total_cbm(frm) {
        recalc_all_items(frm);
    },

    custom_total_weight(frm) {
        recalc_all_items(frm);
    },

    custom_total_volume_weight(frm) {
        recalc_all_items(frm);
    },

    custom_totals_in_cbm(frm) {

        const cbm = flt(frm.doc.custom_totals_in_cbm || 0);
        frm.set_value("custom_total_cbm", cbm);

        recalc_all_items(frm);

    },

    custom_gross_weight(frm) {

        const wt = flt(frm.doc.custom_gross_weight || 0);
        frm.set_value("custom_total_weight", wt);

        recalc_all_items(frm);

    }

});

frappe.ui.form.on("SI Dimension Details", {
    no_of_boxes(frm, cdt, cdn) { calculate_dimension_row(frm, locals[cdt][cdn]); },
    length_cm(frm, cdt, cdn) { calculate_dimension_row(frm, locals[cdt][cdn]); },
    breadth_cm(frm, cdt, cdn) { calculate_dimension_row(frm, locals[cdt][cdn]); },
    height_cm(frm, cdt, cdn) { calculate_dimension_row(frm, locals[cdt][cdn]); },
    weight_kg(frm) { update_dimension_totals(frm); }
});

function calculate_dimension_row(frm, row) {
    let L = flt(row.length_cm || 0);
    let B = flt(row.breadth_cm || 0);
    let H = flt(row.height_cm || 0);
    let boxes = flt(row.no_of_boxes || 1);

    row.cbm = flt((L * B * H / 1000000.0) * boxes);

    let divisor = (frm.doc.custom_mode || "").toUpperCase().startsWith("COURIER")
        ? 5000
        : 6000;

    row.volume_weight = flt((L * B * H / divisor) * boxes);

    update_dimension_totals(frm);
    // frm.refresh_field("custom_dimension_details");
}

function update_dimension_totals(frm) {
    console.log("UPDATE DIM TOTALS CALLED", frm.doc.custom_dimension_details);
    let total_cbm = 0,
        total_weight = 0,
        total_boxes = 0,
        total_volume_weight = 0;

    (frm.doc.custom_dimension_details || []).forEach(row => {
        total_cbm += flt(row.cbm || 0);
        total_weight += flt(row.weight_kg || 0);
        total_boxes += flt(row.no_of_boxes || 0);
        total_volume_weight += flt(row.volume_weight || 0);
    });

    total_cbm = flt(total_cbm, 2);

    // Canonical totals
    frm.set_value("custom_total_no_of_boxes", total_boxes);
    frm.set_value("custom_total_cbm", total_cbm);
    frm.set_value("custom_total_weight", total_weight);
    frm.set_value("custom_total_volume_weight", total_volume_weight);

    // Mirror into manual display fields
    frm.set_value("custom_totals_in_cbm", total_cbm);
    frm.set_value("custom_gross_weight", total_weight);

    recalc_all_items(frm);
}

// =======================================================
// PARENT TOTAL (RESTORED & LIVE)
// =======================================================

// function update_custom_total_parent(frm) {
//     // Exit silently if field does not exist
//     if (!frm.fields_dict.custom_total_inr) {
//         return;
//     }

//     let total = 0;

//     (frm.doc.items || []).forEach(item => {
//         total += flt(item.custom_total_in_inr || 0);
//     });

//     frm.set_value("custom_total_inr", total);
// }


function recalc_all_items(frm) {
    (frm.doc.items || []).forEach(row => {
        // ONLY recalc rows using formula
        // if (row.custom_formulaa) {
        //     recalc_item_row(frm, row);
        // }
        
        if (!(frm.__in_paste || frm.__in_import)) {
            calculate_row(frm, row);
        }
        // calculate_row(frm, row);


    });
    // frm.refresh_field("items");
}


function get_effective_totals(frm) {
    const has_dimensions =
        (frm.doc.custom_dimension_details || []).some(r =>
            flt(r.cbm || 0) > 0 || flt(r.weight_kg || 0) > 0
        );

    if (has_dimensions) {
        return {
            cbm: flt(frm.doc.custom_total_cbm || 0),
            weight: flt(frm.doc.custom_total_weight || 0),
            volume_weight: flt(frm.doc.custom_total_volume_weight || 0)
        };
    }

    // fallback to manual entry
    return {
        cbm: flt(frm.doc.custom_totals_in_cbm || 0),
        weight: flt(frm.doc.custom_gross_weight || 0),
        volume_weight: flt(frm.doc.custom_total_volume_weight || 0)
    };
}


function calculate_row(frm, row) {

    let user_rate = flt(row.custom_custom_rate);
    let exchange_rate = flt(row.custom_exchange_rate);
    let total = flt(row.custom_total);

    if (exchange_rate === null || exchange_rate === undefined) return;

    let mode = (frm.doc.custom_mode || "").toUpperCase();
    let totals = get_effective_totals(frm);

    // =============================
    // FORMULA MODE
    // =============================
    if (row.custom_formulaa) {

        if (!user_rate) return;

        if (["SEA - LCL IMPORT", "SEA - LCL EXPORT", "SEA - FCL IMPORT", "SEA - FCL EXPORT"].includes(mode)) {
            total = totals.cbm * user_rate;
        }
        else if (["AIR - IMPORT", "AIR - EXPORT", "COURIER - Import", "COURIER - Export"].includes(mode)) {
            total = Math.max(totals.weight, totals.volume_weight) * user_rate;
        }

        frappe.model.set_value(row.doctype, row.name, "custom_total", total);
    }

    // =============================
    // MANUAL MODE
    // =============================
    else {

        // auto-fill ONLY if empty
        // if (!total && user_rate) {
        //     total = user_rate;
        //     frappe.model.set_value(row.doctype, row.name, "custom_total", total);
        // }
        if (!total && user_rate && !(frm.__in_paste || frm.__in_import)) {
            total = user_rate;
            frappe.model.set_value(row.doctype, row.name, "custom_total", total);
        }

        if (!total) return;
    }

    // =============================
    // FINAL CALC
    // =============================
    let total_value = total * exchange_rate;

    frappe.model.set_value(row.doctype, row.name, "custom_total_value", total_value);
    frappe.model.set_value(row.doctype, row.name, "custom_total_in_inr", total_value);
    // frappe.model.set_value(row.doctype, row.name, "rate", total_value);

    let qty = flt(row.qty || 1);
    let new_rate = total_value / qty;

    // ONLY update rate if formula mode OR rate is empty
    if ((row.custom_formulaa || !row.rate) && !(frm.__in_paste || frm.__in_import)) {
        frappe.model.set_value(row.doctype, row.name, "rate", new_rate);
    }
}