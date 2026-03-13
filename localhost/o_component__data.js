// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

import { o_state, o_wsmsg__syncdata } from './index.js';

import {
    f_o_html_from_o_js,
} from "./lib/handyhelpers.js"

import {
    a_o_model,
    f_s_name_table__from_o_model,
    f_o_model__from_params,
    s_name_prop_id,
    s_name_prop_ts_created,
    s_name_prop_ts_updated,
    o_wsmsg__f_delete_table_data,
    f_o_wsmsg
} from './constructors.js';
import { f_send_wsmsg_with_response } from './index.js';


let a_s_name_prop__auto = [s_name_prop_id, s_name_prop_ts_created, s_name_prop_ts_updated];

let o_component__data = {
    name: 'component-data',
    template: (await f_o_html_from_o_js({
        a_o: [
            {
                class: "a_o_model",
                a_o:[
                    {
                        's_tag': "div",
                        ":class": "'interactable' + (o_model2.s_name === o_model?.s_name ? ' active' : '')",
                        'v-for': "o_model2 of o_state.a_o_model",
                        'innerText': "{{ o_model2.s_name }} ({{ (o_state[f_s_name_table__from_o_model(o_model2)] || []).length }})",
                        'v-on:click': "f_select_model(o_model2)",
                    },

                ]
            },
            {
                's_tag': "div",
                'v-if': "o_model",
                'class': "o_form__create",
                a_o: [
                    {
                        's_tag': "div",
                        'innerText': "New {{ o_model.s_name }}",
                    },
                    {
                        's_tag': "div",
                        'class': "a_o_input",
                        a_o: [
                            {
                                's_tag': "div",
                                'v-for': "o_property of a_o_property__editable",
                                'class': "o_input_group",
                                a_o: [
                                    {
                                        's_tag': "div",
                                        'innerText': "{{ o_property.s_name }}",
                                    },
                                    {
                                        's_tag': "input",
                                        ':type': "o_property.s_type === 'number' ? 'number' : 'text'",
                                        ':step': "o_property.s_type === 'number' ? 'any' : undefined",
                                        'v-model': "o_instance__new[o_property.s_name]",
                                        ':placeholder': "o_property.s_name",
                                    },
                                ]
                            },
                        ]
                    },
                    {
                        's_tag': "div",
                        'class': "interactable",
                        'v-on:click': "f_create_instance",
                        'innerText': "Create",
                    },
                ]
            },
            {
                's_tag': "div",
                'v-if': "o_model",
                'class': "interactable",
                'v-on:click': "f_clear_table",
                'innerText': "Delete all data",
            },
            {
                's_tag': "div",
                'v-if': "o_model",
                'class': "a_o_model_data_table",
                a_o: [
                    {
                        's_tag': "div",
                        'class': "o_row o_row__header",
                        a_o: [
                            {
                                'v-for': "o_property of o_model?.a_o_property",
                                's_tag': "div",
                                'class': "o_cell",
                                innerText: "{{ o_property.s_name }}",
                            },
                            {
                                's_tag': "div",
                                'class': "o_cell",
                                innerText: "actions",
                            },
                        ]
                    },
                    {
                        's_tag': "div",
                        'v-for': "o_instance in o_state[f_s_name_table__from_o_model(o_model)]",
                        'class': "o_row o_instance",
                        a_o: [
                            {
                                'v-for': "o_property of o_model?.a_o_property",
                                's_tag': "div",
                                'class': "o_cell",
                                a_o: [
                                    {
                                        's_tag': "input",
                                        'v-if': "o_property.s_type === 'string' && !a_s_name_prop__auto.includes(o_property.s_name)",
                                        'type': "text",
                                        ':value': "o_instance[o_property.s_name]",
                                        'v-on:change': "f_update_property(o_instance, o_property, $event.target.value)",
                                        ':placeholder': "o_property.s_name",
                                    },
                                    {
                                        's_tag': "input",
                                        'v-if': "o_property.s_type === 'number' && !a_s_name_prop__auto.includes(o_property.s_name)",
                                        'type': "number",
                                        'step': "any",
                                        ':value': "o_instance[o_property.s_name]",
                                        'v-on:change': "f_update_property(o_instance, o_property, Number($event.target.value))",
                                        ':placeholder': "o_property.s_name",
                                    },
                                    {
                                        's_tag': "div",
                                        'v-if': "a_s_name_prop__auto.includes(o_property.s_name) || (o_property.s_type !== 'string' && o_property.s_type !== 'number')",
                                        innerText: "{{ o_instance[o_property.s_name] }}",
                                    },
                                ]
                            },
                            {
                                's_tag': "div",
                                'class': "o_cell td__actions",
                                a_o: [
                                    {
                                        's_tag': "div",
                                        'class': "interactable",
                                        'v-on:click': "f_delete_instance(o_instance)",
                                        'innerText': "delete",
                                    },
                                ]
                            },
                        ]
                    },
                ]
            },
        ]
    })).outerHTML,
    data: function() {
        return {
            o_state: o_state,
            o_model: null,
            o_instance__new: {},
            a_s_name_prop__auto,
        };
    },
    computed: {
        a_o_property__editable: function() {
            if (!this.o_model) return [];
            return this.o_model.a_o_property.filter(function(o_property) {
                return !a_s_name_prop__auto.includes(o_property.s_name);
            });
        },
    },
    methods:{
        f_s_name_table__from_o_model,

        f_select_model: function(o_model2) {
            this.o_model = o_model2;
            this.o_instance__new = {};
        },
        f_clear_table: async function() {
            let o_self = this;
            let s_name_table = f_s_name_table__from_o_model(o_self.o_model);
            if(!confirm(`Delete all data from ${s_name_table}?`)) return;
            await f_send_wsmsg_with_response(
                f_o_wsmsg(
                    o_wsmsg__f_delete_table_data.s_name,
                    [s_name_table]
                )
            );
            o_state[s_name_table] = [];
        },
        f_delete_instance: async function(o_instance) {
            let o_self = this;
            let s_name_table = f_s_name_table__from_o_model(o_self.o_model);
            await o_wsmsg__syncdata.f_v_sync({
                s_name_table,
                s_operation: 'delete',
                o_data: { n_id: o_instance.n_id }
            });
        },
        f_create_instance: async function() {
            let o_self = this;
            let o_data = {};
            let s_name_table = f_s_name_table__from_o_model(o_self.o_model);
            for (let o_property of o_self.a_o_property__editable) {
                let v_val = o_self.o_instance__new[o_property.s_name];
                if (o_property.s_type === 'number') {
                    v_val = Number(v_val);
                }
                o_data[o_property.s_name] = v_val;
            }
            await o_wsmsg__syncdata.f_v_sync({
                s_name_table,
                s_operation: 'create',
                o_data
            });
            o_self.o_instance__new = {};
        },
        f_update_property: async function(o_instance, o_property, v_val) {
            let o_self = this;
            let s_name_table = f_s_name_table__from_o_model(o_self.o_model);
            await o_wsmsg__syncdata.f_v_sync({
                s_name_table,
                s_operation: 'update',
                o_data: { n_id: o_instance.n_id, [o_property.s_name]: v_val }
            });
        },
    },
    created: function() {
    },
    beforeUnmount: function() {
    },
};

export { o_component__data };
