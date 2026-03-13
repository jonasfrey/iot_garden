import { O_cpu_core_stats,
    O_cpu_stats,
    O_cpu_stats__diff,
    O_meminfo,
    O_meminfo_property,
   O_number_value,
   O_nvidia_smi_help_info, 
   O_nvidia_smi_metric, 
   O_nvidia_smi_section,
   O_shader_error,
   O_shader_info,
   O_webgl_program,
   O_webgl_uniform_location
} from "./handyhelpers_classes.js";

let f_s_number__from_s_input = function(
   s_input
){
   // Regular expression to find all sequences of digits, including decimals
   const regex = /(\d+(\.\d+)?)/g;

   // Extract matches using the regular expression
   const matches = s_input.match(regex);

   // If matches are found, convert them to numbers, otherwise return an empty array
   return matches ? matches.map(Number) : [];
}

let f_o_number_value__from_s_input = function(s_input) {
   // Remove extraneous characters like square brackets and trim whitespace
   s_input = s_input.replace(/[\[\]]/g, '').trim();

   // List of known units with their respective base multipliers
   let a_o = [
       {
           n_pow: Math.pow(10, -3),
           a_a_s_name_unit_alternative_s_name_unit: [
               [['mW', 'MW', 'Milliwatts', 'MilliWatts',], 'Watt',],
               [['mV', 'MV', 'Millivolts', 'MilliVolts',], 'Volt',],
               [['mm', 'MM', 'Millimeters', 'MilliMeters',], 'Meter',],
               [['ml', 'ML', 'Milliliters', 'MilliLiters'], 'Liter',]
           ]
       },
       {
           n_pow: Math.pow(10, -2),
           a_a_s_name_unit_alternative_s_name_unit: [
               [['cl', 'CL', 'Centiliters', 'CentiLiters',],'Liter',],
               [['cm', 'CM', 'Centimeters', 'CentiMeters', ],'Meter',],
               [['%', 'Percent', ],'Percent'],
           ]
       },
       {
           n_pow: Math.pow(10, -1),
           a_a_s_name_unit_alternative_s_name_unit: [
               [['dm', 'DM', 'Decimeters', 'DeciMeters',],'Meter',],
               [['dl', 'DL', 'Deciliters', 'DeciLiters'],'Liter'],
           ]
       },
       {
           n_pow: Math.pow(10, 0),
           a_a_s_name_unit_alternative_s_name_unit: [
               [['W', 'w', 'Watts', 'Watt',], 'Watt',],
               [['V', 'v', 'Volts', 'Volt',], 'Volt',],
               [['C', 'c', 'Celsius', '°C',], 'Celsius',],
               [['F', 'f', 'Fahrenheit', '°F',], 'Fahrenheit',],
               [['K', 'k', 'Kelvin',], 'Kelvin',],
               [['M', 'm', 'Meters', ], 'Meter',],
               [['Hz', 'HZ', 'hZ', 'Hertz'], 'Hertz',],
               [['RPM', 'rpm', 'rpm', 'revolutions per minute'], 'Revolutions per minute',],
           ]
       },
       {
           n_pow: Math.pow(10, 1),
           a_a_s_name_unit_alternative_s_name_unit: [
               [['daL', 'DAL', 'Decaliters', 'DecaLiters',], 'Liter',],
               [['daM', 'DAM', 'Decameters', 'DecaMeters'], 'Meter',],
           ]
       },
       {
           n_pow: Math.pow(10, 2),
           a_a_s_name_unit_alternative_s_name_unit: [
               [['hL', 'HL', 'Hectoliters', 'HectoLiters',], 'Liter',],
               [['hM', 'HM', 'Hectometers', 'HectoMeters',], 'Meter', ],
           ]
       },
       {
           n_pow: Math.pow(10, 3),
           a_a_s_name_unit_alternative_s_name_unit: [
               [['kHz', 'KHz', 'KHZ', 'Kilohertz', 'KiloHertz',], 'Hertz',],
               [['km', 'KM', 'Kilometers', 'KiloMeters',], 'Meter',],
               [['kL', 'KL', 'Kiloliters', 'KiloLiters'], 'Liter',],
           ]
       },
       {
           n_pow: Math.pow(1000, 1), // 10^3 bytes (Kilobytes)
           a_a_s_name_unit_alternative_s_name_unit: [
               [['kB', 'KB', 'Kilobytes', 'KiloBytes'], 'Byte']
           ]
       },
       {
           n_pow: Math.pow(1000, 1) * 8, // 10^3 bits (Kilobits)
           a_a_s_name_unit_alternative_s_name_unit: [
               [['Kb', 'kB', 'Kilobits', 'KiloBits'], 'Byte']
           ]
       },
       {
           n_pow: Math.pow(1024, 1), // 1024^1 bytes (Kibibytes)
           a_a_s_name_unit_alternative_s_name_unit: [
               [['KiB', 'KIB', 'Kibibytes', 'KibiBytes'], 'Byte']
           ]
       },
       {
           n_pow: Math.pow(1024, 1) * 8, // 1024^1 bits (Kibibits)
           a_a_s_name_unit_alternative_s_name_unit: [
               [['Kib', 'KIB', 'Kibibits', 'KibiBits'], 'Byte']
           ]
       },
       {
           n_pow: Math.pow(1000, 2), // 10^6 bytes (Megabytes)
           a_a_s_name_unit_alternative_s_name_unit: [
               [['MB', 'Mb', 'Megabytes', 'MegaBytes'], 'Byte']
           ]
       },
       {
           n_pow: Math.pow(1000, 2) * 8, // 10^6 bits (Megabits)
           a_a_s_name_unit_alternative_s_name_unit: [
               [['Mb', 'MB', 'Megabits', 'MegaBits'], 'Byte']
           ]
       },
       {
           n_pow: Math.pow(1024, 2), // 1024^2 bytes (Mebibytes)
           a_a_s_name_unit_alternative_s_name_unit: [
               [['MiB', 'MIB', 'Mebibytes', 'MebiBytes'], 'Byte']
           ]
       },
       {
           n_pow: Math.pow(1024, 2) * 8, // 1024^2 bits (Mebibits)
           a_a_s_name_unit_alternative_s_name_unit: [
               [['Mib', 'MIB', 'Mebibits', 'MebiBits'], 'Byte']
           ]
       },
       {
           n_pow: Math.pow(1000, 3), // 10^9 bytes (Gigabytes)
           a_a_s_name_unit_alternative_s_name_unit: [
               [['GB', 'Gb', 'Gigabytes', 'GigaBytes'], 'Byte']
           ]
       },
       {
           n_pow: Math.pow(1000, 3) * 8, // 10^9 bits (Gigabits)
           a_a_s_name_unit_alternative_s_name_unit: [
               [['Gb', 'GB', 'Gigabits', 'GigaBits'], 'Byte']
           ]
       },
       {
           n_pow: Math.pow(1024, 3), // 1024^3 bytes (Gibibytes)
           a_a_s_name_unit_alternative_s_name_unit: [
               [['GiB', 'GIB', 'Gibibytes', 'GibiBytes'], 'Byte']
           ]
       },
       {
           n_pow: Math.pow(1024, 3) * 8, // 1024^3 bits (Gibibits)
           a_a_s_name_unit_alternative_s_name_unit: [
               [['Gib', 'GIB', 'Gibibits', 'GibiBits'], 'Byte']
           ]
       },
       {
           n_pow: Math.pow(10, 6), // Megahertz
           a_a_s_name_unit_alternative_s_name_unit: [
               [['MHz', 'MHZ', 'Megahertz', 'MegaHertz'], 'Byte']
           ]
       },
       {
           n_pow: Math.pow(10, 9), // Gigahertz
           a_a_s_name_unit_alternative_s_name_unit: [
               [['GHz', 'GHZ', 'Gigahertz', 'GigaHertz'], 'Byte']
           ]
       }, 
       {
           n_pow: Math.pow(1000, 4), // 10^12 bytes (Terabytes)
           a_a_s_name_unit_alternative_s_name_unit: [
               [['TB', 'Tb', 'Terabytes', 'TeraBytes'], 'Byte']
           ]
       },
       {
           n_pow: Math.pow(1000, 4) * 8, // 10^12 bits (Terabits)
           a_a_s_name_unit_alternative_s_name_unit: [
               [['Tb', 'TB', 'Terabits', 'TeraBits'], 'Byte']
           ]
       },
       {
           n_pow: Math.pow(1024, 4), // 1024^4 bytes (Tebibytes)
           a_a_s_name_unit_alternative_s_name_unit: [
               [['TiB', 'TIB', 'Tebibytes', 'TebiBytes'], 'Byte']
           ]
       },
       {
           n_pow: Math.pow(1024, 4) * 8, // 1024^4 bits (Tebibits)
           a_a_s_name_unit_alternative_s_name_unit: [
               [['Tib', 'TIB', 'Tebibits', 'TebiBits'], 'Byte']
           ]
       }, 
       {
           n_pow: Math.pow(1000, 5), // 10^15 bytes (Petabytes)
           a_a_s_name_unit_alternative_s_name_unit: [
               [['PB', 'Pb', 'Petabytes', 'PetaBytes'], 'Byte']
           ]
       },
       {
           n_pow: Math.pow(1000, 5) * 8, // 10^15 bits (Petabits)
           a_a_s_name_unit_alternative_s_name_unit: [
               [['Pb', 'PB', 'Petabits', 'PetaBits'], 'Byte']
           ]
       },
       {
           n_pow: Math.pow(1024, 5), // 1024^5 bytes (Pebibytes)
           a_a_s_name_unit_alternative_s_name_unit: [
               [['PiB', 'PIB', 'Pebibytes', 'PebiBytes'], 'Byte']
           ]
       },
       {
           n_pow: Math.pow(1024, 5) * 8, // 1024^5 bits (Pebibits)
           a_a_s_name_unit_alternative_s_name_unit: [
               [['Pib', 'PIB', 'Pebibits', 'PebiBits'], 'Byte']
           ]
       }
   ];
       
 
   // Extract the number and the unit from the input string using regex
   // let a_s_match = s_input.match(/^([+-]?\d*\.?\d+)\s*(\w+)/);
   let a_s_match = s_input.match(/^([+-]?\d*\.?\d+)\s*([^\s]+)/);

   if (!a_s_match) throw new Error(`Invalid input format: ${s_input}`);
   let [_, s_num, s_name_unit_matched] = a_s_match;
   let s_name_unit_base = '';
   let a_s_name_unit_alterative = '';
   let o_found = a_o.find(o=>{
       return o.a_a_s_name_unit_alternative_s_name_unit.find(a_s_name_unit_alternative_s_name_unit=>{
           let [a_s_name_unit_alterative2,s_name_unit_base2] = a_s_name_unit_alternative_s_name_unit;
           if(a_s_name_unit_alterative2.includes(s_name_unit_matched)){
               s_name_unit_base = s_name_unit_base2
               a_s_name_unit_alterative = a_s_name_unit_alterative2 
               return true;
           }
           return false
       });
   });
   if (!o_found) {
       throw new Error(`Unknown unit in input string: ${s_input}, possible unit strings are ${a_o.map(o=>o.a_a_s_name_unit_alternative_s_name_unit).join(',')}`);
   }
   let n_num = parseFloat(s_num);
   let n_value_base = n_num * o_found.n_pow;


   // Conversion factors for SI and binary prefixes
   const a_o_factor = {
       nano: Math.pow(10, -9),
       micro: Math.pow(10, -6),
       milli: Math.pow(10, -3),
       centi: Math.pow(10, -2),
       deci: Math.pow(10, -1),
       base: 1,
       kilo: Math.pow(10, 3),
       mega: Math.pow(10, 6),
       giga: Math.pow(10, 9),
       tera: Math.pow(10, 12),
       peta: Math.pow(10, 15), 
       kibi: Math.pow(1024, 1),
       mebi: Math.pow(1024, 2),
       gibi: Math.pow(1024, 3),
       tebi: Math.pow(1024, 4),
       peti: Math.pow(1024, 5)
   };


   // Create the object to hold all unit conversions
   let o_number_value = new O_number_value(
       s_input, 
       s_name_unit_matched, 
       s_name_unit_base, 
       a_s_name_unit_alterative 
   );

   // Populate the SI units
   for (let [s_prefix, n_factor] of Object.entries(a_o_factor)) {
       let s_prop = `n_${s_prefix}`
       if(s_prefix == 'base'){s_prop = 'n'}
       let n_res = n_value_base / n_factor
       o_number_value[s_prop] = n_res
   }

   return o_number_value;
}
let f_a_o_number_value_temperature_from_s_temp = function(
   s_temp
){
   let o_number_value = f_o_number_value__from_s_input(s_temp);
   let o_number_value_celsius = null;
   let o_number_value_fahrenheit = null;
   let o_number_value_kelvin = null;
   if(o_number_value.s_name_base_unit == 'Celsius'){
       o_number_value_celsius = o_number_value;
       let n_fahrenheit = (o_number_value_celsius.n * 9/5) + 32;
       let n_kelvin = o_number_value_celsius.n + 273.15;
       o_number_value_fahrenheit = f_o_number_value__from_s_input(`${n_fahrenheit} Fahrenheit`);
       o_number_value_kelvin = f_o_number_value__from_s_input(`${n_kelvin} Kelvin`);
   }
   if(o_number_value.s_name_base_unit == 'Fahrenheit'){
       o_number_value_fahrenheit = o_number_value;
       let n_celsius = (o_number_value_fahrenheit.n - 32) * 5/9;
       let n_kelvin = (o_number_value_fahrenheit.n - 32) * 5/9 + 273.15;
       o_number_value_celsius = f_o_number_value__from_s_input(`${n_celsius} Celsius`);
       o_number_value_kelvin = f_o_number_value__from_s_input(`${n_kelvin} Kelvin`);
   }
   if(o_number_value.s_name_base_unit == 'Kelvin'){
       o_number_value_kelvin = o_number_value;
       let n_celsius = o_number_value_kelvin.n - 273.15;
       let n_fahrenheit =(o_number_value_kelvin.n - 273.15) * 9/5 + 32;
       o_number_value_celsius = f_o_number_value__from_s_input(`${n_celsius} Celsius`);
       o_number_value_fahrenheit = f_o_number_value__from_s_input(`${n_fahrenheit} Fahrenheit`);
   }

   return [
       o_number_value_kelvin,
       o_number_value_celsius,
       o_number_value_fahrenheit
   ]
}

let f_a_a_v__from_a_v__f_b = function(
   a_v, 
   f_b
){
   let a_a_v = [[]];
   let a_v__last = a_a_v.at(-1)
   for(let v of a_v){
       let b = f_b(v);
       if(
           b
       ){
           a_v__last = []
           a_a_v.push(a_v__last)
       }
       a_v__last.push(v)
       
   }
   return a_a_v
}
let f_b_denojs = function(){
   return 'Deno' in globalThis
}

let f_o_nvidia_smi_help_info = async function(){
   let s_command = 'nvidia-smi --help-query-gpu'
   let a_s_arg = s_command.split(' ');
   const o_command = new Deno.Command(
       a_s_arg.shift(),
       {args: a_s_arg}
   );
   const { code, stdout, stderr } = await o_command.output();
   let a_o_nvidia_smi_metric = []
   let a_o_nvidia_smi_section = []
   if(code === 0){
       let s_stdout = new TextDecoder().decode(stdout);
       let a_s_line = s_stdout.split('\n');


       let s_tag_section_start = 'Section about'

       let a_a_s_line = f_a_a_v__from_a_v__f_b(
           a_s_line, 
           (s) =>{return s.startsWith(s_tag_section_start)}
       );
       // console.log(a_a_s_line)

       for(let a_s_line of a_a_s_line){
           let s_text = a_s_line.join('\n');
           let a_s = s_text.split('\n\n');
           console.log(a_s);

           let o_nvidia_smi_section = new O_nvidia_smi_section(
               '', 
               '', 
               []
           );
           for(let s_n_idx in a_s){
               let s = a_s[s_n_idx];
               if(s.trim()==''){
                   continue
               }
               let a_s_part = s.split('\n');
               let s_first = a_s_part?.[0];
               let s_second = a_s_part?.slice(1).join('\n')
               if(parseInt(s_n_idx) == 0){
                   
                   o_nvidia_smi_section.s_title = s_first 
                   o_nvidia_smi_section.s_description  = s_second
                   a_o_nvidia_smi_section.push(o_nvidia_smi_section)
                   continue 
               }
               let o_metric = new O_nvidia_smi_metric(
                   s_first?.replaceAll('"', ' ').trim().split(' or ').map(s=>s.trim()), 
                   s_second
               )
               a_o_nvidia_smi_metric.push(
                   o_metric
               )
               o_nvidia_smi_section.a_o_nvidia_smi_metric.push(o_metric)
           }
       }
       // console.log(a_s_metric[10])
       // return f_res() 
   }

   // console.assert(code === 0);
   // console.assert("hello\n" === new TextDecoder().decode(stdout));
   // console.assert("world\n" === new TextDecoder().decode(stderr));
   // return f_rej(`could not run ${s_command}`)

   return new O_nvidia_smi_help_info(
       a_o_nvidia_smi_metric, 
       a_o_nvidia_smi_section
   )
}
let f_o_nvidia_smi_info = async function(
   a_o_nvidia_smi_metric
){
   if(a_o_nvidia_smi_metric.length == 0){
       throw Error(`a_o_nvidia_smi_metric.length has to be bigger than 0`)
   }
   // show metrics 
   // nvidia-smi --help-query-gpu
   let s_command = `nvidia-smi --format=csv --query-gpu=${a_o_nvidia_smi_metric.map(
       o=>{
           return o.a_s_name[0]
       }
   ).join(',')}`

   // nvidia-smi --format=csv --query-gpu=name,temperature.gpu,memory.used
   // console.log(s_command)
   let a_s_arg = s_command.split(' ');
   const o_command = new Deno.Command(
       a_s_arg.shift(),
       {args: a_s_arg}
   );
   const { code, stdout, stderr } = await o_command.output();
   if(code === 0){
       let s_stdout = new TextDecoder().decode(stdout);
       // console.log(s_stdout)
       let a_s_line = s_stdout.split('\n');
       let s_separator = ','
       let a_s_prop = a_s_line[0].split(s_separator);
       return Object.assign(
           {}, 
           ...a_s_line?.[1].split(s_separator).map((v,n_idx)=>{
               // console.log(a_s_prop)
               return {
                   // [`o_${a_o_nvidia_smi_metric[n_idx].a_s_name[0]}`]: {
                   [a_o_nvidia_smi_metric[n_idx].a_s_name[0]]: {
                       s_value : v, 
                       s_name: a_s_prop[n_idx], 
                       ...f_o_number_value__from_s_input(v)
                   }, 
               }
           })
       )
   }

}

let f_o_meminfo__from_s_proc_meminfo = function(
   s_proc_meminfo 
){
   let o_meminfo = new O_meminfo();
   let a_s = s_proc_meminfo.split('\n').filter(v=>v.trim()!='')
   // console.log(a_s)
   let n_bytes_mem_total = null;
   let o_s_unit_n_factor = {
       'b': 1, 
       'kb': 1024, 
       'mb': 1024*1024,
       'gb': 1024*1024*1024,
       'tb': 1024*1024*1024*1024,
   };
   for(let s of a_s){
       let a_s_part = s.split(':');
       let s_prop = a_s_part.shift().replaceAll('(', "_").replaceAll(")", '_');
       let s_num_and_unit = a_s_part.join(':').trim();
       a_s_part = s_num_and_unit.split(' ');
       let n_num = parseFloat(a_s_part.shift());
       let s_unit = a_s_part.join(' ').trim();


       let n_factor = o_s_unit_n_factor[s_unit.toLowerCase()];

       // if(!n_factor){
       //     // throw Error(`could not read unit in meminfo  line ${s}`);
       // }
       
       
       let o_meminfo_property = o_meminfo[`o_meminfo_property_${s_prop}`]; 
       
       if(!o_meminfo_property){
           o_meminfo_property = new O_meminfo_property(
               ''
               )
               o_meminfo[`o_meminfo_property_${s_prop}`] = o_meminfo_property
           }
       o_meminfo_property.n = n_num
       if(n_factor){ 
                      
           o_meminfo_property.n_bytes = parseInt(n_num * n_factor);
           if(s_prop == 'MemTotal'){
               n_bytes_mem_total = o_meminfo_property.n_bytes
           }
           if(n_bytes_mem_total){
               o_meminfo_property.n_nor_by_mem_total = o_meminfo_property.n_bytes / n_bytes_mem_total
           }
           o_meminfo_property.n_kilobytes = o_meminfo_property.n_bytes / o_s_unit_n_factor.kb
           o_meminfo_property.n_megabytes = o_meminfo_property.n_bytes / o_s_unit_n_factor.mb
           o_meminfo_property.n_gigabytes = o_meminfo_property.n_bytes / o_s_unit_n_factor.gb
           o_meminfo_property.n_terrabytes = o_meminfo_property.n_bytes / o_s_unit_n_factor.tb
       }

   }
   o_meminfo.o_meminfo_property_memory_used_calculated.n_bytes = o_meminfo.o_meminfo_property_MemTotal.n_bytes - o_meminfo.o_meminfo_property_MemFree.n_bytes;
   o_meminfo.o_meminfo_property_memory_used_calculated.n_nor_by_mem_total = o_meminfo.o_meminfo_property_memory_used_calculated.n_bytes / n_bytes_mem_total
   o_meminfo.o_meminfo_property_memory_used_calculated.n_kilobytes = o_meminfo.o_meminfo_property_memory_used_calculated.n_bytes / o_s_unit_n_factor.kb
   o_meminfo.o_meminfo_property_memory_used_calculated.n_megabytes = o_meminfo.o_meminfo_property_memory_used_calculated.n_bytes / o_s_unit_n_factor.mb
   o_meminfo.o_meminfo_property_memory_used_calculated.n_gigabytes = o_meminfo.o_meminfo_property_memory_used_calculated.n_bytes / o_s_unit_n_factor.gb
   o_meminfo.o_meminfo_property_memory_used_calculated.n_terrabytes = o_meminfo.o_meminfo_property_memory_used_calculated.n_bytes / o_s_unit_n_factor.tb

   return o_meminfo
}
let f_o_meminfo = async function(){
   let s_path = '/proc/meminfo'
   let s = '';
   let n = globalThis.performance.now();
   try {
       s = await Deno.readTextFile(s_path);
   } catch (error) {
       throw Error(`could not read text file '${s_path}'`)
   }
   return f_o_meminfo__from_s_proc_meminfo(
       s
   )
}

let f_s_type_mime__from_s_extension = function(
   s_extension
){
   const o_s_extension_s_mime_type = {
       'txt': 'text/plain',
       'html': 'text/html',
       'js': 'text/javascript',
       'css': 'text/css',
       'json': 'application/json',
       'jpg': 'image/jpeg',
       'mp3': 'audio/mpeg',
       'mp4': 'video/mp4',
       'pdf': 'application/pdf',
       'zip': 'application/zip',
       'xml': 'application/xml',
       'webm': 'video/webm',
       'ogg': 'audio/ogg',
       'apng': 'image/apng',//: Animated Portable Network Graphics (APNG)
       'avif': 'image/avif',//: AV1 Image File Format (AVIF)
       'gif': 'image/gif',//: Graphics Interchange Format (GIF)
       'jpeg': 'image/jpeg',//: Joint Photographic Expert Group image (JPEG)
       'png': 'image/png',//: Portable Network Graphics (PNG)
       'svg': 'image/svg+xml',//: Scalable Vector Graphics (SVG)
       'webp': 'image/webp',//: Web Picture format (WEBP), 
       'wasm': 'application/wasm'
       // Add more mappings as needed
   };
   s_extension = s_extension.split('.').pop()
   return o_s_extension_s_mime_type[s_extension] || 'application/octet-stream'; 
}
let f_download_text_file = async function(
   s_text, 
   s_name_file = 'file_from_f_download_text_file.txt'
){
   // Create a new Blob containing the text data
   const blob = new Blob([s_text], { type: 'text/plain' });

   // Create a URL for the Blob
   const blobUrl = URL.createObjectURL(blob);

   return f_download_file__from_s_url(
       blobUrl, 
       s_name_file
   )
}
let f_s_type__from_typed_array = function(
   v, 
   b_throw_error = false, 
   o_s_type_rust_s_type_custom = {
        'u8':'u8',
        'u16':'u16',
        'u32':'u32',
        'u64':'u64',
        'i8':'i8',
        'i16':'i16',
        'i32':'i32',
        'i64':'i64',
        'f32':'f32',
        'f64':'f64',
   }
) {
   let s_name = v.constructor.name;
   if(s_name == 'Function'){
       s_name = v.name;
   }
   let o_s_name_typed_array_s_short = {

       [Uint8Array.prototype.constructor.name] : o_s_type_rust_s_type_custom.u8,
       [Uint8ClampedArray.prototype.constructor.name] : o_s_type_rust_s_type_custom.u8,
       [Uint16Array.prototype.constructor.name] : o_s_type_rust_s_type_custom.u16,
       [Uint32Array.prototype.constructor.name] : o_s_type_rust_s_type_custom.u32,
       [BigUint64Array.prototype.constructor.name] : o_s_type_rust_s_type_custom.u64,
       [Int8Array.prototype.constructor.name] : o_s_type_rust_s_type_custom.i8,
       [Int16Array.prototype.constructor.name] : o_s_type_rust_s_type_custom.i16,
       [Int32Array.prototype.constructor.name] : o_s_type_rust_s_type_custom.i32,
       [BigInt64Array.prototype.constructor.name] : o_s_type_rust_s_type_custom.i64,
       [Float32Array.prototype.constructor.name] : o_s_type_rust_s_type_custom.f32,
       [Float64Array.prototype.constructor.name]: o_s_type_rust_s_type_custom.f64,
   }
   let s_short = o_s_name_typed_array_s_short[s_name];
   if(!s_short && b_throw_error){
       throw Error(`value is not a typed array or a function for a typed array, it must be one of ${Object.keys(o_s_name_typed_array_s_short).join(',')}`)
   }
   s_short = (s_short) ?s_short: 'unknown';
   return s_short
}
let f_n_conf_clk_tck = async function(){
   return new Promise(
       async (f_res, f_rej)=>{
           let s_command = 'getconf CLK_TCK'
           let a_s_arg = s_command.split(' ');
           const o_command = new Deno.Command(
               a_s_arg.shift(),
               {args: a_s_arg}
           );
           const { code, stdout, stderr } = await o_command.output();
           let s_stdout = new TextDecoder().decode(stdout)
           let s_stderr = new TextDecoder().decode(stderr)
           let n_code= code;
           if(n_code === 0){
               return f_res(parseInt(s_stdout))
           }

           // console.assert(code === 0);
           // console.assert("hello\n" === new TextDecoder().decode(stdout));
           // console.assert("world\n" === new TextDecoder().decode(stderr));
           return f_rej(`could not run ${s_command}, stdout: ${s_stdout}, stderr:${s_stderr}, code:${n_code}`)
       }

   )
}
let f_s_lscpu = async function(){
   return new Promise(
       async (f_res, f_rej)=>{
           let s_command = 'lscpu'
           let a_s_arg = s_command.split(' ');
           const o_command = new Deno.Command(
               a_s_arg.shift(),
               {args: a_s_arg}
           );
           const { code, stdout, stderr } = await o_command.output();
           if(code === 0){
               return f_res(new TextDecoder().decode(stdout))
           }

           // console.assert(code === 0);
           // console.assert("hello\n" === new TextDecoder().decode(stdout));
           // console.assert("world\n" === new TextDecoder().decode(stderr));
           return f_rej(`could not run ${s_command}`)
       }

   )
}
let a_o_cpu_stats = null;
let n_len_max_a_o_cpu_stats = null;
let f_o_cpu_stats__diff = async function(
   n_len_max_a_o_cpu_stats
){
   let o_cpu_stats__old = null;
   if(a_o_cpu_stats == null){

       if(!n_len_max_a_o_cpu_stats){
           // 30 seconds history of cpu percentage every frame if 60 fps
           n_len_max_a_o_cpu_stats = parseInt((30*1000)/(1000/60))
       }
       a_o_cpu_stats = new Array(
           n_len_max_a_o_cpu_stats
       ).fill(0).map(v=>null)
       o_cpu_stats__old = await f_o_cpu_stats()
       a_o_cpu_stats[0] = o_cpu_stats__old
       // we have to wait a small amount of time to get a usefull cpu measurement
       await f_sleep_ms(1000/60)
   }

   let o_cpu_stats__new = await f_o_cpu_stats()
   // shift every element one to the end
   for(let n_idx in a_o_cpu_stats){
       let n_idx_reverse = (a_o_cpu_stats.length-1)-n_idx;
       // console.log(n_idx_reverse)
       if(n_idx_reverse == 0){
           break
       }
       let v = a_o_cpu_stats[n_idx_reverse];
       let v_before = a_o_cpu_stats[n_idx_reverse-1];
       if(v_before == null){
           continue
       }
       a_o_cpu_stats[n_idx_reverse] = v_before
   }
   a_o_cpu_stats[0] = o_cpu_stats__new
   return new O_cpu_stats__diff(
       a_o_cpu_stats[1], 
       o_cpu_stats__new
   )
}
let n_conf_clk_tck_cached = null;
let f_o_cpu_stats__from_s_proc_stat = async function(
   s_proc_stat, 
   n_conf_clk_tck
){
   if(!n_conf_clk_tck && n_conf_clk_tck_cached == null){
       n_conf_clk_tck = await f_n_conf_clk_tck()
       n_conf_clk_tck_cached = n_conf_clk_tck
   }
   n_conf_clk_tck = n_conf_clk_tck_cached
   // console.log(s_proc_stat.split('\n'));
   let a_s = s_proc_stat.split('\n');
   let a_s_cpu = a_s.filter(s=>s.startsWith('cpu'));
   let o_cpu_core_stats__total = null;
   let o_cpu_stats = new O_cpu_stats(
       s_proc_stat,
       n_conf_clk_tck,
       a_s.filter(s=>s.startsWith('ctxt')).map(s=>parseInt(s.split(' ').pop())),
       a_s.filter(s=>s.startsWith('btime')).map(s=>parseInt(s.split(' ').pop())),
       a_s.filter(s=>s.startsWith('processes')).map(s=>parseInt(s.split(' ').pop())),
       a_s.filter(s=>s.startsWith('procs_running')).map(s=>parseInt(s.split(' ').pop())),
       a_s.filter(s=>s.startsWith('procs_blocked')).map(s=>parseInt(s.split(' ').pop())),
       a_s.filter(s=>s.startsWith('softirq')).map(s=>parseInt(s.split(' ').pop())),

       [],
       o_cpu_core_stats__total
   )
   o_cpu_stats.a_o_cpu_core_stats = a_s_cpu.map(
       s=>{

           let a_s = s.split(' ').filter(v=>v.trim()!='');
           // console.log(a_s.slice(1).map(s=>parseInt(s)))
           let o = new O_cpu_core_stats(
               s,
               o_cpu_stats.n_conf_clk_tck,
               o_cpu_stats.n_ts_ms,
               o_cpu_stats.n_ms_window_performance_now,
               ...a_s.slice(1)
               .map(
                   s=>(parseFloat(s)/n_conf_clk_tck)*1000
               )
           )
           if(! /\d/.test(a_s[0])){
               o_cpu_stats.o_cpu_core_stats__total = o;
               return false
           }
           return o
       }
   ).filter(v=>v)

   return o_cpu_stats
}
let f_o_cpu_stats = async function(
){
   let s_path = '/proc/stat'
   let s_proc_stat = '';
   let n = globalThis.performance.now();
   try {
       s_proc_stat = await Deno.readTextFile(s_path);
   } catch (error) {
       throw Error(`could not read text file '${s_path}'`)
   }
   // console.log(globalThis.performance.now()-n)
   // console.log(s_proc_stat.split('\n'));
   return f_o_cpu_stats__from_s_proc_stat(
       s_proc_stat
   )

}
let f_s_n_beautified = function(
   v, 
   s_separator = "'"
){
   let s = v.toString();
   return new Array(s.length)
       .fill(0)
       .map((s_char, n_idx)=>{

           return [
               s[s.length-1-n_idx],
               ((n_idx+1) % 3 == 0 && n_idx<s.length-1) ? s_separator : false
           ].filter(v=>v)
       })
       .flat(2)
       .reverse()
       .join('');
}
let o_mod_fs = null;
if(f_b_denojs()){
   o_mod_fs = await import("https://deno.land/std@0.205.0/fs/mod.ts");
}
let f_sleep_ms = async function(n_ms){
   return new Promise(
       (f_res)=>{
           return setTimeout(() => {
                   return f_res(n_ms);
           }, n_ms);
       }
   )
}


let f_o_html_element__from_s_tag = async function(s_tag){
   
   let o_doc;
   if(f_b_denojs()){

       let o_DOMParser = (await import("https://deno.land/x/deno_dom@v0.1.42/deno-dom-wasm.ts")).DOMParser;
       o_doc = new o_DOMParser().parseFromString(
           '<div></div>',
           'text/html'
       );
   }else{
       o_doc = document;
   }
   return o_doc.createElement(s_tag);

}


let f_o_html__from_s_html = async function(s_html){
   let o_dom_parser = null;
   if(f_b_denojs()){
       o_dom_parser = new ((await import("https://deno.land/x/deno_dom@v0.1.42/deno-dom-wasm.ts")).DOMParser)();
   }else{
       o_dom_parser = new DOMParser();
   }
   return o_dom_parser.parseFromString(s_html, 'text/html')
}

let f_o_html__from_s_url = async function(s_url){
   let o_resp = await fetch(s_url);
   let s_text = await o_resp.text();
   return f_o_html__from_s_html(s_text);
}
let f_s_name_file__from_s_url = function(s_url){
   return s_url.split('/').pop().split('?').shift().split('#').shift()
}

let f_download_file_denojs = async function(s_url, s_prefix_file=''){

   let s_name_file = f_s_name_file_from_s_url(s_url);
   
   let s_path_file = `./download/${s_prefix_file}_${s_name_file}`;
   
   console.log(`s_path_file: ${s_path_file}`);
   console.log(`handling: ${s_url}`);
   let o_stat = false;
   try {
       o_stat = await Deno.stat(s_path_file);
       console.log(`   file already existing`);
   } catch (error) {
       
   }
   if(! o_stat?.isFile){
       console.log(`   downloading ...`);
    
       let o_blob = await f_o_blob_from_s_url(s_url);
   
       const buffer = new Uint8Array(await o_blob.arrayBuffer());
   
       // Write the video to the file
       return Deno.writeFile(s_path_file, buffer);
   }

}

let f_download_file__from_s_url = async function(
   s_url, 
   s_name_orand_path_file = '',
   f_callback = async function(
       n_mb_downloaded, 
       n_mb_per_sec_domwnload_speed, 
       n_mb_to_download_total
   ){
       let s_from_total = ''
       if(n_mb_to_download_total != -1){
           s_from_total = (`/${(n_mb_to_download_total).toFixed(0)}`)
       }
       let s_line = `downloaded ${(n_mb_downloaded).toFixed(0)}${s_from_total}(MB) @ ${n_mb_per_sec_domwnload_speed.toFixed(2)} MB/s`
       if(f_b_denojs()){
           await Deno.stdout.write(new TextEncoder().encode('\x1b[A'));
           await Deno.stdout.write(new TextEncoder().encode(s_line+'\n'));
       }else{
           console.log(s_line)
       }
   }, 
   n_ms_callback_interval = 333, 
){
   s_name_orand_path_file = (s_name_orand_path_file!='') ? s_name_orand_path_file : f_s_name_file__from_s_url(s_url);
   let b_denojs = f_b_denojs();
   
   console.log('');//write a empty line because cursor will get reset in with_download_speed
   let a_n_u8 = await f_a_n_u8__from_s_url_with_download_speed_easy(s_url, f_callback, n_ms_callback_interval);
   
   if(b_denojs){
       // Write the video to the file
       await o_mod_fs.ensureFile(s_name_orand_path_file);
       return Deno.writeFile(s_name_orand_path_file, a_n_u8);
   }
   if(!b_denojs){
       let o_blob = new Blob(
           [a_n_u8], 
           // {type:'image/jpeg'}
           // {type:f_s_mime_type_from_s_name_file(s_name_file)}
       );
       let o_blob_url = globalThis.URL.createObjectURL(o_blob);
       // Create an anchor link element and set the blob URL as its href
       const a = await f_o_html_element__from_s_tag('a');
       a.href = o_blob_url;
       a.download = s_name_orand_path_file;
       document.body.appendChild(a);  // This is necessary as Firefox requires the link to be in the DOM for the download to trigger
       // Trigger a click event to start the download
       a.click();
       // Clean up: remove the link from the DOM and revoke the blob URL
       document.body.removeChild(a);
       globalThis.URL.revokeObjectURL(o_blob_url);
   }
   return true
}

let f_a_n_u8__from_s_url_with_download_speed_easy = async function(
   s_url,
   f_callback = function(
       n_mb_downloaded, 
       n_mb_per_sec_domwnload_speed, 
       n_mb_to_download_total
   ){}, 
   n_ms_callback_interval = 333
){
   return f_a_n_u8__from_s_url_with_download_speed_interval(
       s_url, 
       function(
           value_read,
           n_len_a_n_u8__read_merged,
           n_ms__since_last_read,
           n_response_header_content_length, 
           n_bytes_per_second
       ){
           let n_mb_downloaded = n_len_a_n_u8__read_merged/(1*1000*1000);
           let n_mb_per_sec_domwnload_speed = n_bytes_per_second/(1*1000*1000);
           let n_mb_to_download_total = -1;
           if(n_response_header_content_length){
               n_mb_to_download_total = n_response_header_content_length / (1*1000*1000);
           }
           f_callback(
               n_mb_downloaded,
               n_mb_per_sec_domwnload_speed,
               n_mb_to_download_total
           )
       },
       n_ms_callback_interval
   )

}

let f_a_n_u8__from_s_url_with_download_speed = async function(
   s_url,
   f_callback, 
   n_ms_callback_interval
){
   return f_a_n_u8__from_s_url_with_download_speed_interval(
       s_url, 
       function(
           value_read,
           n_len_a_n_u8__read_merged,
           n_ms__since_last_read,
           n_response_header_content_length, 
           n_bytes_per_second
       ){
           let n_mb_to_download = (n_response_header_content_length) ? n_response_header_content_length : 'unknown size' 
           let n_downloaded_nor = (n_response_header_content_length) ? (n_len_a_n_u8__read_merged / n_response_header_content_length)*1000 : 'unknown'
           console.log(`MB/s: ${(n_bytes_per_second/(1*1000*1000)).toFixed(2)}`);
           console.log(`downloaded ${(n_len_a_n_u8__read_merged/(1*1000*1000)).toFixed(2)}MB/${n_mb_to_download} (${n_downloaded_nor}%)`);
       },
       300
   )

}
let f_a_n_u8__from_s_url_with_download_speed_interval = async function(
   s_url, 
   f_callback = (
       value_read,
       n_len_a_n_u8__read_merged,
       n_ms__since_last_read,
       n_response_header_content_length, 
       n_bytes_per_second
   )=>{}, 
   n_ms_callback_interval
){
   let b_denojs = f_b_denojs();
   let n_len_a_n_u8__read_merged__last = 0;
   let n_ms_limit = 100;//updaet every 100 milliseconds
   let n_ms__since_last_read__acc = 0;
   return f_a_n_u8__from_s_url(
       s_url, 
       function(
           value_read,
           n_len_a_n_u8__read_merged,
           n_ms__since_last_read,
           n_response_header_content_length,
       ){
           n_ms__since_last_read__acc+=n_ms__since_last_read;

           if(n_ms__since_last_read__acc >= n_ms_limit){
               let n_bytes_per_millisecond = Math.abs(n_len_a_n_u8__read_merged__last-n_len_a_n_u8__read_merged) / n_ms_limit;
               n_ms__since_last_read__acc = n_ms__since_last_read__acc - n_ms_limit;
               f_callback(
                   ...arguments,
                   n_bytes_per_millisecond*1000
               )
               n_len_a_n_u8__read_merged__last = n_len_a_n_u8__read_merged

           }
       }
   )
}
let f_a_n_u8__from_s_url = async function(
   s_url, 
   f_callback = (
       value_read,
       n_len_a_n_u8__read_merged,
       n_ms__since_last_read,
       n_response_header_content_length
   ) => {}
){
   let o_resp = await fetch(s_url);
   const n_response_header_content_length = o_resp.headers.get('Content-Length');
   return f_a_n_u8__from_o_reader(
       o_resp.body?.getReader(), 
       function(
           value_read, 
           n_len_a_n_u8__read_merged, 
           n_ms__since_last_read
       ){
           f_callback(
               ...arguments,
               n_response_header_content_length
           )
       }
   )
}
let f_a_n_u8__from_o_reader = async function(
   o_readble_stream_reader, 
   f_callback = (
       value_read,
       n_len_a_n_u8__read_merged,
       n_ms__since_last_read
   )=>{}
){

   let n_ms__now = globalThis.performance.now()
   let n_ms__last = globalThis.performance.now() 
   let n_ms__since_last_read = globalThis.performance.now() 

   let a_a_n_u8 = []
   let n_len_a_n_u8__read_merged = 0;
   while(true){
       n_ms__now = globalThis.performance.now()
       n_ms__since_last_read = Math.abs(n_ms__last - n_ms__now);
       const {done: b_done, value} = await o_readble_stream_reader.read();
       if(b_done){
           break;
       }
       n_len_a_n_u8__read_merged += value.length;
       f_callback(
           value, 
           n_len_a_n_u8__read_merged, 
           n_ms__since_last_read
       );
       a_a_n_u8.push(value);
       n_ms__last = n_ms__now;
   }
   let a_n_u8__merged = new Uint8Array(n_len_a_n_u8__read_merged);
   let n_idx = 0;
   for(let a_n_u8 of a_a_n_u8){
       a_n_u8__merged.set(a_n_u8, n_idx);
       n_idx+=a_n_u8.length
   }
   return a_n_u8__merged
}



let f_s_hashed = async function(
   s_text, 
   s_hash_function = 'SHA-1'
){
   let a_s_hash_function__allowed = [
       'sha-1', 'sha-256', 'sha-384', 'sha-512'
   ];
   if(!a_s_hash_function__allowed.includes(s_hash_function.toLowerCase())){
       throw Error(`hash function '${s_hash_function}' is not allowed, allowed functions are ${a_s_hash_function__allowed.join(',')}`)
   }
   const a_n_u8 = new TextEncoder().encode(s_text); // encode as (utf-8) Uint8Array
   const o_abuffer = await crypto.subtle.digest(s_hash_function, a_n_u8); // hash the message
   const a_n = Array.from(new Uint8Array(o_abuffer)); // convert buffer to byte array
   const s_hashed = a_n
       .map((b) => b.toString(16).padStart(2, "0"))
       .join(""); // convert bytes to hex string
   return s_hashed;
}

let f_o__from_o_fetch_response = function(o_resp){
   //JSON.stringify((await fetch('https://deno.com'))) returns an empty object
   return {
       status: o_resp.status, 
       statusText: o_resp.statusText, 
       headers: Object.assign(
           {},
           ...Array.from(o_resp.headers.entries()).map(([key, value])=>{return {[key]:value}})
       )
       
   }
}




let f_s_name_file_cached__readable_ignore_fragment_and_getparams = async function(
   s_url, 
){
   s_url = s_url.split('?').shift();
   s_url = s_url.split('#').shift();
   s_url = s_url.replaceAll('/', '__')
   s_url = s_url.replaceAll('.', '__')
   s_url = s_url.split('.')
   s_url = s_url.replaceAll(':', '__')
   return s_url
}
let f_s_name_file_cached__hashed = async function(
   s_url, 
){
   return f_s_hashed(s_url);
}
let f_s_name_file_cached__base64encoded = async function(
   s_url, 
){
   return btoa(s_url);
}
let f_o_resp__fetch_cached = async function(
   f_fetch, 
   a_v_arg__for_f_fetch,
   b_overwrite_cached_file = false, 
   n_ms_diff__overwrite_cached_file = 24*60*60*1000, 
   f_s_name_file_cached = f_s_name_file_cached__hashed,
   s_path_folder_cache = './.cache_for_f_a_n_u8__fetch_cached'
){
   if(typeof f_fetch != 'function'){
       throw Error('please provide the (prefered) fetch function as first argument');
   }
   await o_mod_fs.ensureDir(s_path_folder_cache);
   let s_name_file = await f_s_name_file_cached(
       a_v_arg__for_f_fetch[0] 
   ) 
   let s_path_file = `${s_path_folder_cache}/${s_name_file}`
   let s_path_file_meta_json = `${s_path_folder_cache}/${s_name_file}.json`
   let a_n_u8 = null;
   let b_path_existing = await o_mod_fs.exists(s_path_file);

   let n_ts_ms__created = new Date().getTime();
   if(b_path_existing && !b_overwrite_cached_file){
       let o_stat = await Deno.stat(s_path_file);
       n_ts_ms__created = new Date(o_stat.birthtime).getTime();
       let n_ts_ms_diff = new Date().getTime() - n_ts_ms__created;
       if(n_ts_ms_diff > n_ms_diff__overwrite_cached_file){
           b_overwrite_cached_file = true
       }
   }
   let o_resp_meta = {}
   let b_from_disk = false;
   if(b_path_existing && !b_overwrite_cached_file){
       a_n_u8 = await Deno.readFile(s_path_file);
       let s_json_o_resp_meta = await Deno.readTextFile(s_path_file_meta_json);
       o_resp_meta = JSON.parse(s_json_o_resp_meta)
       b_from_disk = true;
   }else{
       let o_resp = await f_fetch(
           ...a_v_arg__for_f_fetch
       );
       o_resp_meta = f_o__from_o_fetch_response(o_resp)
       // Object.assign(o_resp_meta, {n_ts_ms__created_on_disk:n_ts_ms__created})// we cannot for sure know that n_ts_ms__created is also the ts thath the file gets
       let s_json_o_resp_meta = JSON.stringify(o_resp_meta)
       a_n_u8 = new Uint8Array(await o_resp.arrayBuffer());
       await Deno.writeFile(s_path_file, a_n_u8);
       await Deno.writeTextFile(s_path_file_meta_json, s_json_o_resp_meta)
   }
   let o_resp = new Response(
       a_n_u8, 
       o_resp_meta
   )
   if(b_from_disk){
       Object.assign(o_resp, {b_from_disk:true})
   }

   return o_resp

}
let f_n_idx_ensured_inside_array = function(
   n_idx,
   n_len, 
){
   if(n_idx<0){
       n_idx = (n_len + (n_idx % n_len))
   }
   return n_idx % n_len
}
let f_v_at_n_idx_relative = function(
   a_v, 
   v, 
   n_idx_offset
){
   let n_idx = a_v.indexOf(v);
   if(n_idx == -1){
       throw Error(`index is -1, item v${v} is not in array a_v${a_v}`)
   }
   return a_v[
       f_n_idx_ensured_inside_array(
           Math.trunc(n_idx+n_idx_offset),
           a_v.length
       )
   ]
}
let f_move_in_array = function(a_v, n_idx_from, n_idx_to){

   let n_len = a_v.length; 
   n_idx_from = f_n_idx_ensured_inside_array(n_idx_from, n_len);
   n_idx_to = f_n_idx_ensured_inside_array(n_idx_to, n_len);

   // Remove the element from the array
   const v = a_v.splice(n_idx_from, 1)[0];
   // Place the v at the new index
   a_v.splice(n_idx_to, 0, v);
   return a_v; // This is optional; the array is modified in place
}
let f_swap_in_array = function(a_v, n_idx_1, n_idx_2){
   let n_len = a_v.length;
   n_idx_1 = f_n_idx_ensured_inside_array(n_idx_1, n_len);
   n_idx_2 = f_n_idx_ensured_inside_array(n_idx_2, n_len);
   let v_1 = a_v[n_idx_1];
   let v_2 = a_v[n_idx_2];
   a_v[n_idx_1] = v_2;
   a_v[n_idx_2] = v_1
   return a_v;
}
let f_move_v_in_array = function(
   a_v, 
   v,
   n_idx_diff
){
   let n_idx_from = a_v.indexOf(v);
   let n_idx_to = n_idx_from + n_idx_diff;
   return f_move_in_array(a_v, n_idx_from, n_idx_to); 
}
let f_swap_v_in_array = function(
   a_v,
   v_1,
   v_2,
){
   let n_idx_1 = a_v.indexOf(v_1);
   let n_idx_2 = a_v.indexOf(v_2);
   return f_swap_in_array(a_v, n_idx_1, n_idx_2); 
}
let f_a_v_add_v_circular_to_array = function(
   a_v, 
   v,
   n_len_max, 
   b_insert_at_beginning = false
){
   if(a_v.length < n_len_max){
       a_v.push(v)
       if(!b_insert_at_beginning){
           return a_v
       }
   }
   if(a_v.length > n_len_max){
       a_v = a_v.slice(0,n_len_max);
   }
   if(b_insert_at_beginning){

       // let a_v_new = [
       //     v,
       //     ...a_v.slice(1),
       // ]
       for(let n_idx = (a_v.length-1); n_idx>0; n_idx-=1){
           a_v[n_idx] = a_v[n_idx-1];
       }
       a_v[0] = v
   }
   if(!b_insert_at_beginning){

       for(let n_idx = 0; n_idx<a_v.length; n_idx+=1){
           a_v[n_idx] = a_v[n_idx+1];
       }
       a_v[a_v.length-1] = v
   }

   return a_v
}

let f_a_v__recursive = function(
   n_y,
   n_x, 
   f_v, 
   n_idx_y
){
   if(n_y == 1){
       return new Array(n_x).fill(0).map((v,n_idx)=>f_v(n_idx,n_idx_y))
   }else{
       return new Array(n_x).fill(0).map((v,n_idx)=>f_a_v__recursive(n_y-1,n_x,f_v,n_idx))
   }
}

let f_a_a_v__combinations = function(
   a_v
){
   let a_a_v = []
   let n_possible_combos = Math.pow(2, a_v.length)-1;
   for(let n= 1; n<= n_possible_combos; n+=1){
       // console.log(n)
       a_a_v.push(
           a_v.filter((v, n_idx)=>{
               return (n & (1 << n_idx))
           })
       )
   }
   return a_a_v
}


let f_v_s__between = function(
   s,
   s_start,
   s_end
) {
   let n_idx_start = s.indexOf(s_start);
   let n_idx_end = s.indexOf(s_end, n_idx_start + s_start.length);

   if (n_idx_start === -1 || n_idx_end === -1) {
       return null; // One or both of the strings were not found
   }
   // Extract the substring, adding the length of the start string to the start index
   return s.substring(n_idx_start + s_start.length, n_idx_end);
}
let f_o_s_type_s_name_typedarray = function(){
   return {
       'a_n_i8': 'Int8Array',
       'a_n_u8': 'Uint8Array',
       'a_n_i16': 'Int16Array',
       'a_n_u16': 'Uint16Array',
       'a_n_i32': 'Int32Array',
       'a_n_u32': 'Uint32Array',
       'a_n_f32': 'Float32Array',
       'a_n_f64': 'Float64Array',
       'a_n_i64': 'BigInt64Array',
       'a_n_u64': 'BigUint64Array',
   }
}
   
let f_v_s_name_typedarray_from_s_type = function(s){

   let o_s_type_s_name_typedarray = f_o_s_type_s_name_typedarray();
   return o_s_type_s_name_typedarray[s]
}
let f_v_s_name_type_from_s_name_typedarray = function(s){
   let o_s_type_s_name_typedarray = f_o_s_type_s_name_typedarray();
   let n_idx = Object.values(o_s_type_s_name_typedarray).indexOf(s);
   if(n_idx == -1){
       return undefined
   }
   return Object.keys(o_s_type_s_name_typedarray)[n_idx]

}
let f_v_s_type__from_value = function(value){
   if(value === undefined){
       return undefined
   }

   let s_constructor_name = value?.constructor?.name;

   if(!s_constructor_name){
       return 'v'
   }
   let v_s_name_type = f_v_s_name_type_from_s_name_typedarray(s_constructor_name);
   if(v_s_name_type){
       return v_s_name_type
   }
   if(s_constructor_name == 'Number'){
       return 'n_f64'
   }
   if(s_constructor_name == 'String'){
       return 's'
   }
   
   return 'v'
}

let f_v_s_type_from_array = function(a_v){

   let s = f_v_s_type__from_value(a_v)
   if(s?.startsWith('a')){
       return s
   }
   const v_s_type_first = f_v_s_type__from_value(a_v[0]);
   if(v_s_type_first === undefined){
       return undefined;
   }
   if(v_s_type_first === 'v'){
       return 'a_v'
   }

   for(let n_idx = 1; n_idx < a_v.length; n_idx+=1){
       if(f_v_s_type__from_value(a_v[n_idx])!=v_s_type_first){
           return 'a_v'
       }
   }
   return `a_${v_s_type_first}`
}


let f_s_uuidv4 = function() {
   if(!('crypto' in globalThis)){
       console.warn('the crypto global property is not available in this JS runtime, https://developer.mozilla.org/en-US/docs/Web/API/crypto_property')

       return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
       .replace(/[xy]/g, function (c) {
           const r = Math.random() * 16 | 0, 
               v = c == 'x' ? r : (r & 0x3 | 0x8);
           return v.toString(16);
       });
   }

   return crypto.randomUUID()
}
let f_b_uuid = function(s){
   // let o_regexp = new RegExp(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
   let o_regexp = new RegExp(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
   return o_regexp.test(s)
}

let f_a_n_nor__rgb__from_a_n_nor__hsl = (
   n_hue_nor, 
   n_saturation_nor, 
   n_lightness_nor
) => {
   let n_hue_deg = n_hue_nor*360;
   const k = n => (n +  n_hue_deg / 30) % 12;
   const a = n_saturation_nor * Math.min(n_lightness_nor, 1 - n_lightness_nor);
   const f = n =>
   n_lightness_nor - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
   return [f(0), f(8), f(4)];
};



// const f_a_n_nor__hsl__from_a_n_nor__rgb = (
//     n_r_nor,
//     n_g_nor,
//     n_b_nor
//     ) => {

//     const l = Math.max(n_r_nor, n_g_nor, n_b_nor);
//     const s = l - Math.min(n_r_nor, n_g_nor, n_b_nor);
//     const h = s
//       ? l === n_r_nor
//         ? (n_g_nor - n_b_nor) / s
//         : l === n_g_nor
//         ? 2 + (n_b_nor - n_r_nor) / s
//         : 4 + (n_r_nor - n_g_nor) / s
//       : 0;
//     return [
//        (60 * h < 0 ? 60 * h + 360 : 60 * h)/360,
//        (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0),
//        ((2 * l - s)) / 2,
//     ];
//   };

let f_a_n_rgb_from_n_hue_nor = function(n_hue_nor){
   let n_colors = 3; 
   let n_nor = n_hue_nor;//0.0; // 0- 1./3. red, 1./3. - 2./3./ green , 2/3 - 3/3 blue
   let n_nor2 = n_nor*n_colors;
   let a_n_interpolated = new Array(n_colors).fill(0);
   a_n_interpolated[Math.floor(n_nor2)] = (1.-n_nor2%1.0)
   a_n_interpolated[(Math.floor(n_nor2)+1)%n_colors] = n_nor2%1.0
   let a_n_rgb = a_n_interpolated.map(n=>{return n*255})
   return a_n_rgb;
}
let f_a_n_nor__hsl__from_a_n_nor__rgb = function(r, g, b) {
 const vmax = Math.max(r, g, b), vmin = Math.min(r, g, b);
 let h, s, l = (vmax + vmin) / 2;

 if (vmax === vmin) {
   return [0, 0, l]; // achromatic
 }

 const d = vmax - vmin;
 s = l > 0.5 ? d / (2 - vmax - vmin) : d / (vmax + vmin);
 if (vmax === r) h = (g - b) / d + (g < b ? 6 : 0);
 if (vmax === g) h = (b - r) / d + 2;
 if (vmax === b) h = (r - g) / d + 4;
 h /= 6;

 return [h, s, l];
}

let f_b_js_object =function(v){
   return typeof v === 'object' &&
       !Array.isArray(v) &&
       !v.constructor.name.includes('Array') &&
       v !== null
}



let f_o_empty_recursive = function(
   o,
   f_v_empty = function(
       v, s_prop
   ){
       if(Array.isArray(v)){
           return []
       }

       return null
   }
){
   let o_new = {}
   for(let s_prop in o){
       let v = o[s_prop]
       if(f_b_js_object(v)){
           console.log(v)
           o_new[s_prop] = f_o_empty_recursive(v);
       }else{
           o_new[s_prop] = f_v_empty(v, s_prop) 
       }
   }
   return o_new
}


let f_o_image_data_from_s_url = async function(s_url){
   return new Promise(
       (f_res, f_rej)=>{
           let o_img = new Image();
           o_img.onload = function(){
               let o_canvas = document.createElement('canvas');
               var o_ctx = o_canvas.getContext('2d');
               o_canvas.width = o_img.width;
               o_canvas.height = o_img.height;            
               o_ctx.drawImage(o_img, 0, 0);
               return f_res(
                   o_ctx.getImageData(0, 0, o_img.width, o_img.height)
               );
           }
           o_img.onerror = (o_e)=>{return f_rej(o_e)}
           o_img.src = s_url;
       }
   )
}

let f_a_o_shader_error = function(
   s_code_shader,
   o_shader,
   o_ctx, 
   o_shader_info
){
   let a_o = [];
   if (!o_ctx.getShaderParameter(o_shader, o_ctx.COMPILE_STATUS)) {
       let s_shader_info_log = o_ctx.getShaderInfoLog(o_shader);
       let a_s_ignore = [
           '', 
           null, 
           undefined, 
           false, 
           '\u0000'
       ]
       if(a_s_ignore.includes(s_shader_info_log)){return []}
       a_o = s_shader_info_log
           ?.split('\n')
           ?.filter(s=>!a_s_ignore.includes(s))
           ?.map(s=>{
               console.error(s)
               let a_s_part = s.split(':').map(s=>s.trim());
               let s_error_prefix = a_s_part[0];
               let n_idx = parseInt(a_s_part[1]);
               let n_line = parseInt(a_s_part[2]);
               let s_code_content_with_error__quoted = a_s_part[3];
               // console.log(a_s_part)
               let s_code_content_with_error = s_code_content_with_error__quoted.substring(1, s_code_content_with_error__quoted.length-1)
               let s_error_type = a_s_part[4];
               let s_line_code_with_error = s_code_shader.split('\n')[n_line-1];
               // console.log(s)
               let n_idx_s_code = s_line_code_with_error.indexOf(s_code_content_with_error);
               let n_idx_s_code_second = s_line_code_with_error.indexOf(s_code_content_with_error, n_idx_s_code+1);
               let s_line_pointing_out_error = s
               if(n_idx_s_code_second != -1 || n_idx_s_code == -1){
                   let n_idx_first_non_whitespace = s_line_code_with_error.search(/\S/);
                   let n_remaining = s_line_code_with_error.length - n_idx_first_non_whitespace;
                   // we cannot be sure to find the exact match of the error 
                   // for example the 'd' is found firstly in voi'd', but the error is actually in void main() {'d'...
                   // void main() {d
                   //     ^undeclared identifier
                   s_line_pointing_out_error = `${' '.repeat(n_idx_first_non_whitespace)}${'-'.repeat(n_remaining)} ${s_error_type}`
               }else{
                   s_line_pointing_out_error = `${' '.repeat(n_idx_s_code)}${'^'.repeat(s_code_content_with_error.length)} ${s_error_type}`
               }
               let n_pad = (n_line.toString().length+1);
               let s_rustlike_error = [
                   `${s_error_prefix} ${s_code_content_with_error__quoted}`,
                   `${' '.repeat(n_pad)}|`,
                   `${n_line.toString().padEnd(n_pad, ' ')}|${s_line_code_with_error}`,
                   `${' '.repeat(n_pad)}|${s_line_pointing_out_error}`,
               ].join('\n')
               return new O_shader_error(
                   o_shader_info, 
                   s_error_prefix,
                   n_idx,
                   n_line,
                   s_code_content_with_error__quoted,
                   s_error_type,
                   s_line_code_with_error,
                   s_rustlike_error
               )
           });
   }

   return a_o;
}


let f_o_shader_info_and_compile_shader = function(
   s_type, 
   s_code_shader, 
   o_ctx
){
   let o_shader_info = new O_shader_info(
       s_type,
       s_code_shader,
       null,
       []
   )
   let a_s_type__allowed = ['vertex', 'fragment'];
   if(!a_s_type__allowed.includes(s_type)){
       throw Error(`s_type: ${s_type} is not allowed, allowed are ${JSON.stringify(a_s_type__allowed)}`);
   }
   o_shader_info.o_shader = o_ctx.createShader(o_ctx[`${s_type.toUpperCase()}_SHADER`])
   o_ctx.shaderSource(o_shader_info.o_shader, s_code_shader);
   o_shader_info.n_ts_ms_start_compile  = new Date().getTime()
   let n_ms = globalThis.performance.now()
   o_ctx.compileShader(o_shader_info.o_shader);
   o_shader_info.n_ms_duration_compile = globalThis.performance.now()-n_ms;
   o_shader_info.a_o_shader_error = f_a_o_shader_error(
       s_code_shader,
       o_shader_info.o_shader,
       o_ctx, 
       o_shader_info
   );
   if(o_shader_info.a_o_shader_error.length > 0){
       o_ctx.deleteShader(o_shader_info.o_shader);
   }
   return o_shader_info;
}
let f_o_shader_info = f_o_shader_info_and_compile_shader
let f_o_webgl_program = function(
   o_canvas, 
   s_code_shader__vertex = '',
   s_code_shader__fragment = '', 
   o_options__getContext = {}
){
   let s_name_a_o_vec_position_vertex = 'a_o_vec_position_vertex' 
   let s_context_webgl_version = 'webgl2';

   
   let o_ctx = o_canvas.getContext(
       s_context_webgl_version,
       Object.assign(
           {
               preserveDrawingBuffer: true, // o_canvas.getContext(...).readPixels(...) will return 0 without this, 
               // antialias: false // blitFrameBfufer wont work without this, since something with multisampling
           },
           o_options__getContext
       )
   );
   if (!o_ctx) {
       throw Error(`${s_context_webgl_version} is not supported or disabled in this browser.`);
   }

   // console.error('ERROR compiling fragment shader!', s_shader_info_log);
   let o_map = {
       'fragment': s_code_shader__fragment, 
       'vertex': s_code_shader__vertex
   }

   let a_o_shader_info = Object.keys(o_map).map(
       s=>{
           return f_o_shader_info(
               s, 
               o_map[s], 
               o_ctx
           )
       }
   ).flat();

   for(let o_shader_info of a_o_shader_info){
       if(o_shader_info.a_o_shader_error.length > 0){
           console.error(`shader with type '${o_shader_info.s_type}' could not compile, error(s):`)
           throw Error('\n'+o_shader_info.a_o_shader_error.map(o=>o.s_rustlike_error).join('\n\n')+'\n\n')
       }
   }

   // Create and use the program
   var o_shader__program = o_ctx.createProgram();
   for(let o_shader_info of a_o_shader_info){
       o_ctx.attachShader(o_shader__program, o_shader_info.o_shader);
   }
   o_ctx.linkProgram(o_shader__program);
   if (!o_ctx.getProgramParameter(o_shader__program, o_ctx.LINK_STATUS)) {
       console.error('ERROR linking o_shader__program!', o_ctx.getProgramInfoLog(o_shader__program));
       o_ctx.deleteProgram(o_shader__program);
       return;
   }
   o_ctx.useProgram(o_shader__program);
   

   let o_s_name_o_uniform_location = {
       'o_scl_canvas': new O_webgl_uniform_location(
           'o_scl_canvas', 
           o_ctx.getUniformLocation(o_shader__program, 'o_scl_canvas'), 
           [o_canvas.width, o_canvas.height]
       )
   }
   // Set uniform value (vec2)
   o_ctx.uniform2f(o_s_name_o_uniform_location.o_scl_canvas.o_uniform_location, o_canvas.width, o_canvas.height);

   // Set the positions for a square.
   let a_o_vec_position_vertex = [
       -1, -1,
       1, -1,
      -1,  1,
       1,  1,
   ];
   var o_buffer_position = o_ctx.createBuffer();
   o_ctx.bindBuffer(o_ctx.ARRAY_BUFFER, o_buffer_position);
   o_ctx.bufferData(o_ctx.ARRAY_BUFFER, new Float32Array(a_o_vec_position_vertex), o_ctx.STATIC_DRAW);
   // Tell WebGL how to pull out the positions from the position buffer into the vertexPosition attribute
   var o_afloc_a_o_vec_position_vertex = o_ctx.getAttribLocation(o_shader__program, s_name_a_o_vec_position_vertex);
   

   // Additional setup for drawing (e.g., buffers, attributes)
   return new O_webgl_program(
       o_canvas, 
       o_ctx, 
       a_o_shader_info,
       o_shader__program, 
       s_name_a_o_vec_position_vertex, 
       o_s_name_o_uniform_location, 
       s_context_webgl_version, 
       o_buffer_position,
       a_o_vec_position_vertex,
       o_afloc_a_o_vec_position_vertex
   )

}
let f_delete_o_webgl_program = function(
   o_webgl_program
) {
   // Get the attached shaders
   const a_o_shader_attached = o_webgl_program.o_ctx.getAttachedShaders(o_webgl_program.o_shader__program);


   // Detach and delete each shader
   a_o_shader_attached.forEach(o_shader_attached => {
       o_webgl_program.o_ctx.detachShader(o_webgl_program.o_shader__program, o_shader_attached);
       o_webgl_program.o_ctx.deleteShader(o_shader_attached);
   });
   // Delete any buffers associated with the program
   if (o_webgl_program.a_o_buffer) {
       o_webgl_program.a_o_buffer.forEach(o_buffer => {
           o_webgl_program.o_ctx.deleteBuffer(o_buffer);
       });
   }

   // Delete any textures associated with the program
   if (o_webgl_program.a_o_texture) {
       o_webgl_program.a_o_texture.forEach(o_texture => {
           o_webgl_program.o_ctx.deleteTexture(o_texture);
       });
   }

   // Delete any framebuffers (if used)
   if (o_webgl_program.a_o_framebuffer) {
       o_webgl_program.a_o_framebuffer.forEach(o_fb => {
           o_webgl_program.o_ctx.deleteFramebuffer(o_fb);
       });
   }

   // Delete any renderbuffers (if used)
   if (o_webgl_program.a_o_renderbuffer) {
       o_webgl_program.a_o_renderbuffer.forEach(o_rb => {
           o_webgl_program.o_ctx.deleteRenderbuffer(o_rb);
       });
   }

   // Delete any Vertex Array Objects (VAOs) if used (for WebGL2 or extension in WebGL1)
   if (o_webgl_program.a_o_vao) {
       o_webgl_program.a_o_vao.forEach(o_vao => {
           o_webgl_program.o_ctx.deleteVertexArray(o_vao);
       });
   }

   // Delete the program
   o_webgl_program.o_ctx.deleteProgram(o_webgl_program.o_shader__program);
}
let f_resize_canvas_from_o_webgl_program = function(
   o_webgl_program, 
   n_scl_x, 
   n_scl_y
){
   o_webgl_program.o_canvas.width = n_scl_x;
   o_webgl_program.o_canvas.height = n_scl_y;

   // Set the viewport to match the canvas dimensions, otherwise the canvas will not resize properly
   o_webgl_program.o_ctx.viewport(0, 0, o_webgl_program.o_canvas.width, o_webgl_program.o_canvas.height);

   let o = o_webgl_program.o_s_name_o_uniform_location.o_scl_canvas;
   o.v_data = [o_webgl_program.o_canvas.width, o_webgl_program.o_canvas.height]
   o_webgl_program.o_ctx.uniform2f(
       o.o_uniform_location,
       o.v_data[0], o.v_data[1]
   );
}

let f_render_from_o_webgl_program = function(
   o_webgl_program
){
   o_webgl_program.o_ctx.bindBuffer(o_webgl_program.o_ctx.ARRAY_BUFFER, o_webgl_program.o_buffer_position);
   o_webgl_program.o_ctx.enableVertexAttribArray(o_webgl_program.o_afloc_a_o_vec_position_vertex);
   o_webgl_program.o_ctx.vertexAttribPointer(o_webgl_program.o_afloc_a_o_vec_position_vertex, 2, o_webgl_program.o_ctx.FLOAT, false, 0, 0);
   // Draw the square
   o_webgl_program.o_ctx.drawArrays(o_webgl_program.o_ctx.TRIANGLE_STRIP, 0, 4);
}

let f_ddd = function(){

   let o_date = new Date();
   let n_year = o_date.getUTCFullYear();
   let n_month = o_date.getUTCMonth()+1;
   let n_day = o_date.getUTCDate();
   let n_hours = o_date.getUTCHours();
   let n_minutes = o_date.getUTCMinutes();
   let n_seconds = o_date.getUTCSeconds();

   let s_month_zeropadded = n_month.toString().padStart(2,'0');
   let s_day_zeropadded = n_day.toString().padStart(2,'0');
   let s_hours_zeropadded = n_hours.toString().padStart(2,'0');
   let s_minutes_zeropadded = n_minutes.toString().padStart(2,'0');
   let s_seconds_zeropadded = n_seconds.toString().padStart(2,'0');
   let s_milliseconds_zeropadded = o_date.getUTCMilliseconds().toString().padStart(3,'0');

   let s_ymd_hms = `${n_year}-${s_month_zeropadded}-${s_day_zeropadded} ${s_hours_zeropadded}:${s_minutes_zeropadded}:${s_seconds_zeropadded}.${s_milliseconds_zeropadded}`
   
   let s_date = `f_ddd: ${s_ymd_hms}`;
   let s = `
╔═${`═`.repeat(s_date.length)}═╗
║ ${s_date} ║
╚═${`═`.repeat(s_date.length)}═╝
`.trim()
   console.log(s)
   return f_dd(...arguments);
}
let f_dd = function(){
   
   console.log(...arguments);
   if(f_b_denojs()){
       Deno.exit();
   }
}


let f_o_object_assign_nested = function(
   o1, 
   o2
){
   for(let s_prop in o2){
       let v = o2[s_prop];
       if(typeof v == 'object' && !Array.isArray(v)){
           o1[s_prop] = (o1[s_prop]) ? o1[s_prop] : {}
           f_o_object_assign_nested(
               o1[s_prop],
               v
           )
           continue
       }
       o1[s_prop] = v;
   }
   return o1
}
let f_throw = (
   s_type_expected,
   s_type_present,
   s_path_prop, 
)=>{
   throw Error(
       JSON.stringify(
           {
               s_msg: 'type error',
               s_path_prop, 
               s_type_expected, 
               s_type_present, 
           },
           null, 
           4
       )
   )
}
let o_s_prefix_f_callback = {
   's': (v,s_path_prop)=>{
       let s_type_expected = "string";
       let s_type = typeof v;
       if(typeof v != s_type_expected){
           f_throw(s_type_expected, s_type, s_path_prop)
       }
   }, 
   'n': (v,s_path_prop)=>{
       let s_type_expected = "number";
       let s_type = typeof v;
       if(typeof v != s_type_expected){
           f_throw(s_type_expected, s_type, s_path_prop)
       }
   }, 
   'a': (v,s_path_prop)=>{
       let s_type_expected = "array";
       let s_type = typeof v;
       if(!v.constructor.name.includes('Array')){
           f_throw(s_type_expected, s_type, s_path_prop)
       }
   },
   'o': (v,s_path_prop)=>{
       let s_type_expected = "object";
       let s_type = typeof v;
       if(!f_b_js_object(v)){
           f_throw(s_type_expected, v?.constructor?.name, s_path_prop)
       }
   }
}
let f_b_check_type_and_potentially_throw_error = function(
   o, 
   s_path_prop = '',
   b_recursive = true
){

   for(let s in o){
       let s_prefix = s[0];
       let v = o[s];
       let s_path_prop2 = `${s_path_prop}.${s}`
       o_s_prefix_f_callback?.[s_prefix]?.(v,s_path_prop2);
       if(b_recursive){

           if(typeof v == 'object' && !v.constructor.name.includes('Array')){
               f_b_check_type_and_potentially_throw_error(
                   v, 
                   s_path_prop2,
                   b_recursive
               )
           }
       }
   }
   return true
}
let f_a_n_u8_from_s_b64 = function(s_b64){
   f_b_check_type_and_potentially_throw_error({s_b64});
   let s_decoded = atob(s_b64)
   let a_n_u8 = new Uint8Array(s_decoded?.length);
   for (let n_i = 0; n_i < s_decoded?.length; n_i++) {
       a_n_u8[n_i] = s_decoded.charCodeAt(n_i);
   }
   return a_n_u8
}

let f_a_n_trn__relative_to_o_html = function(
   a_n__trn_mouse, 
   o_el
){
   const o_brect  = o_el.getBoundingClientRect();

   return [
       a_n__trn_mouse[0] - o_brect.left,
       a_n__trn_mouse[1] - o_brect.top
   ]
}
let f_a_n_trn__relative_to_o_html__nor = function(
   a_n__trn_mouse, 
   o_el
){
   const o_brect  = o_el.getBoundingClientRect();
   
   let a_n_trn = f_a_n_trn__relative_to_o_html(a_n__trn_mouse, o_el);
   return [
       a_n_trn[0] / o_brect.width,
       a_n_trn[1] / o_brect.height,
   ]    
}

let f_a_o_entry__from_s_path = async function(s_path, b_recursive = false){
   return new Promise(
       async (f_res)=>{
           let a_o = [];
           for  await(let o of Deno.readDir(s_path)){
               a_o.push(o)
               o.s_path_folder_parent = `${s_path}`
               o.s_path_file = `${s_path}/${o.name}`
               if(o.isDirectory && b_recursive){
                   // console.log(`${s_path}/${o.name}`)                    
                   // let a_o2 = await f_a_o_entry__from_s_path(`${s_path}/${o.name}`, b_recursive);
                   a_o.push(f_a_o_entry__from_s_path(`${s_path}/${o.name}`, b_recursive))
               }
           }
           return Promise.all(a_o).then(a_o2 =>{
               return f_res(a_o2.flat())
           })
       }
   )
}
let f_s_bordered = function(a_s, s_char_border_top = '_', s_char_border_bottom = "_", a_s_char_corner = ["+","+","+","+"]){
   if(typeof a_s === 'string'){
       a_s = [a_s]
   }
   let a_a_s = a_s.map(s=>s.split('\n'));
     let s_longest = a_a_s.flat().sort((s1, s2)=>{return s2.length -s1.length})[0];
     let n_len_longest = s_longest.length;
     let s_border_top = s_char_border_top.repeat(n_len_longest + 2);
     let s_border_bottom = s_char_border_bottom.repeat(n_len_longest + 2);
     let s_empty = ' '.repeat(n_len_longest);
     if(a_s_char_corner.length == 1){ 
       a_s_char_corner  = a_s_char_corner[0].repeat(4).split('')
     }
     if(a_s_char_corner.length == 2){ 
       a_s_char_corner  = [
           a_s_char_corner[0],
           a_s_char_corner[0],
           a_s_char_corner[1],
           a_s_char_corner[1],
       ]
     }
     if(a_s_char_corner.length == 3){ 
       a_s_char_corner  = [
           a_s_char_corner[0],
           a_s_char_corner[1],
           a_s_char_corner[2],
           a_s_char_corner[2],
       ]
     }
     let a_s2 = [
       a_a_s.map(a_s=>{
           return [
               (`${a_s_char_corner[0]}${s_border_top}${a_s_char_corner[1]}`),
               (`| ${s_empty} |`),
               ...a_s.map(
               s=>{
                   return (`| ${s.padEnd(n_len_longest, ' ')} |`)
               }
               )
           ].join('\n')
       }).join(
           `\n`
       ),
       `${a_s_char_corner[3]}${s_border_bottom}${a_s_char_corner[2]}`

     ]
   
     return a_s2.join('\n')
     
 }

let f_s_color_rgba_from_a_n_nor_channelcolorrgba = function(a_n){
   let s = `rgba(${a_n.slice(0,3).map(n=>n*255)},${a_n[3]})`
   return s
}
let f_s_color_hex_from_a_n_nor_channelcolorrgba = function(a_n
){
   let s = `#${a_n.slice(0,3).map(n=>parseInt(n*255).toString(16).padStart(2,'0')).join('')}`
   return s
}
let f_a_n_nor_channelcolorrgba_from_color_hex = function(
   s_color_hex
){
   s_color_hex = s_color_hex.trim().replaceAll('#', '');
   let n_col = parseInt(s_color_hex,16);
   let n_nor_alpha = 1;
   let n_channels = (s_color_hex.length == 8) ? 4 : 3;
   let a_n_channelrgba_col_nor = [
       ((n_col >> (8*(n_channels-1)))& (1<<8)-1)/255, 
       ((n_col >> (8*(n_channels-2)))& (1<<8)-1)/255, 
       ((n_col >> (8*(n_channels-3)))& (1<<8)-1)/255, 
       (n_channels == 4) ? ((n_col >> (8*(n_channels-4))) & (1<<8)-1)/255 : n_nor_alpha
   ]
   return a_n_channelrgba_col_nor
}

let f_s_json_from_google_sheet_api_response = function(s_text){
   // Use a regex to extract the JSON part from the response
   const a_s_json = s_text.match(/(?<=\()\{.*\}(?=\))/);
   if (a_s_json && a_s_json[0]) {
       return a_s_json[0]
       // Process jsonData.table.rows to get your data
   } else {
       console.error(`Failed to parse JSON data from response: ${s_text.slice(0, 100)}${(s_text.length > 100) ? '...': ''}`);
   }
}
let f_o_data_from_google_sheet = async function(
   s_sheet_id, 
   s_name_sheet = 'Sheet1', 
){

   // Construct the URL to fetch data from Sheet2
   // there are at least two ways to read data from google sheet with api
   // the first does not need an API key but the sheet has to be 'public anyone can read'
   // it returns the result as a google visualization string that contains some kind of function call
   // the json can be extracted and parsed to an object, tihs will contain a .col property which is the header row(s)
   // that are automatically detected
   let s_url = `https://docs.google.com/spreadsheets/d/${s_sheet_id}/gviz/tq?tqx=out:json&sheet=${s_name_sheet}&tq=SELECT *`;
   // s_url = `https://sheets.googleapis.com/v4/spreadsheets/${s_sheet_id}/values/${s_name_sheet}`//?key=${apiKey}` this requires an api key
   
   return fetch(s_url)
       .then(response => response.text())
       .then(s_text => {
           let s_json = f_s_json_from_google_sheet_api_response(s_text);
           let o = JSON.parse(s_json);
           return f_o_google_sheet_data_from_o_resp_data(o);
       })
       .catch(error => console.error('Error fetching data:', error));
}
let f_o_google_sheet_data_from_o_resp_data = function(o_resp_data){
   let a_o = o_resp_data.table.rows.map(o_row =>{

       let a_o = o_resp_data.table.cols.map((o_col, n_idx)=>{
               // as long as the data in the row does not match the data format of the row
               // the row will get counted as a 'header' row and the 'label' the title of the row 
               // will be a whitespace joined string with the value of each row of the current column
               // example 
               // | s_string        | n_number | b_bool |
               // | str             | num      | bool   |
               //                                              those first two rows are counted as a 'header' 
               //                                              so 'table.cols[0].label will be 's_string str'
               // | tihs is a test  | 1        | TRUE   |  
               // | antoerh one t.  | 2.2      | false  |  
               // | some string t   | 1        | TRUE   |  
               return {
                   [o_col.label.split(' ').shift()] : Object.assign(
                       {o_sheet_col_info: o_col},
                       o_row.c[n_idx]
                   )
               }
           })
       return Object.assign({}, ...a_o);
       
   })
   return {
       a_o: a_o, 
       o_resp_data: o_resp_data
   }
}

let f_o_state_webgl_shader_audio_visualization = async function(
   {
       s_path_or_url_audio_file = null,
       o_array_buffer_encoded_audio_data = null,
       o_audio_buffer_decoded = null,
       a_n_f32_audio_sample = null,
       n_nor_start = 0.0, 
       n_nor_end = 1.0,
       n_nor_playhead = null,
       n_scl_x_canvas = 300, 
       n_scl_y_canvas = 100, 
       n_amp_peaks = 0.25, 
       n_amp_avgrms = 0.125, 
       a_n_rgba_color_amp_peaks = [1., 0., 0., 1. ],
       a_n_rgba_color_amp_avg = [0., 1., 0., 1.]
   }
){
               
   let o_state = Object.assign(
       {
           s_path_or_url_audio_file,
           o_array_buffer_encoded_audio_data,
           a_n_f32_audio_sample,
           n_nor_start,
           n_nor_start__last:n_nor_start, 
           n_nor_end,
           n_nor_end__last:n_nor_end,
           n_nor_playhead,
           o_canvas: null,
           o_ufloc__o_scl_canvas: null,
           o_ufloc__o_date: null,
           o_ufloc__o_trn_mouse: null,
           o_ufloc__n_sec_time: null,
           o_ufloc__n_nor_playhead: null,
           o_ufloc__n_amp_1: null,
           n_scl_x_canvas, 
           n_scl_y_canvas,
           n_ms_audio_start: 0,  
           n_ms_auto_rendering_delta: 0, 
           n_ms_auto_rendering_fps: 0,
           n_ms_auto_rendering_last : 0,
           n_ms_update_time_delta_max : 1000,
           n_amp_peaks,
           n_amp_avgrms,
           n_id_raf : 0,
           b_auto_rendering: false,
           a_n_rgba_color_amp_peaks,
           a_n_rgba_color_amp_avg, 
           f_start_auto_rendering: ()=>{
               if(!o_state.b_auto_rendering){
                   o_state.n_id_raf = o_state.f_raf();
               }
               o_state.b_auto_rendering = true;
           }, 
           f_stop_auto_rendering: ()=>{
               if(o_state.b_auto_rendering){
                   cancelAnimationFrame(o_state.n_id_raf);
               }
               o_state.b_auto_rendering = false;
           }, 
           f_toggle_auto_rendering: ()=>{
               if(o_state.b_auto_rendering){
                   o_state.f_stop_auto_rendering()
               }else{
                   o_state.f_start_auto_rendering();
               }
           }, 
           o_audio_buffer_decoded,
           o_audio_context: null,
           
       }, 
   )

   if(
       s_path_or_url_audio_file != null 
   ){
       o_array_buffer_encoded_audio_data = await(await fetch(s_path_or_url_audio_file)).arrayBuffer();   
   }
   if(o_audio_buffer_decoded != null){
       o_state.o_audio_buffer_decoded = o_audio_buffer_decoded
   }

   if(
       o_array_buffer_encoded_audio_data != null 
   ){
       
       o_state.o_array_buffer_encoded_audio_data = o_array_buffer_encoded_audio_data
       o_state.o_audio_context = new (globalThis.AudioContext || globalThis.webkitAudioContext)();
   
       o_state.o_audio_buffer_decoded = await new Promise((resolve, reject) => {
           o_state.o_audio_context.decodeAudioData(o_state.o_array_buffer_encoded_audio_data, resolve, reject);
       });

   }

   if(
       a_n_f32_audio_sample != null 
   ){
       o_state.a_n_f32_audio_sample = a_n_f32_audio_sample
   }else{
       o_state.a_n_f32_audio_sample = o_state.o_audio_buffer_decoded.getChannelData(0);
   }

   o_state.o_canvas = document.createElement('canvas');
   
   o_state.f_delete_webgl_stuff = function(){
       o_state.o_webgl_program.o_ctx.deleteTexture(o_state.o_texture);
       f_delete_o_webgl_program(o_state.o_webgl_program)
   }

   o_state.f_render = function(){
       if(
           o_state.n_nor_start__last != o_state.n_nor_start
           ||
           o_state.n_nor_end__last != o_state.n_nor_end
           ){
               o_state.f_update_texture_data();
       }
       if(
           o_state.n_nor_start > 1. || o_state.n_nor_start < 0.
           || o_state.n_nor_end > 1. || o_state.n_nor_end < 0.
       ){
           throw Error(`n_nor_start or n_nor_end must be a normalized number between 0.0 and 1.1: current values are ${JSON.stringify({
               n_nor_start: o_state.n_nor_start,
               n_nor_end: o_state.n_nor_end,
           })}`)
       }
       let o_date = new Date();
       let n_sec_of_the_day_because_utc_timestamp_does_not_fit_into_f32_value = (o_date.getTime()/1000.)%(60*60*24)
       // n_sec_of_the_day_because_utc_timestamp_does_not_fit_into_f32_value = (60*60*24)-1 //test
       o_state.o_webgl_program?.o_ctx.uniform4f(o_state.o_ufloc__o_date,
           o_date.getUTCFullYear(),
           o_date.getUTCMonth(), 
           o_date.getUTCDate(),
           n_sec_of_the_day_because_utc_timestamp_does_not_fit_into_f32_value
       );
       o_state.o_webgl_program?.o_ctx.uniform4f(o_state.o_ufloc__i_mouse,
           0, 0, 0, 0
       );
       o_state.o_webgl_program?.o_ctx.uniform4f(o_state.o_ufloc__o_col_peaks,
           ...o_state.a_n_rgba_color_amp_peaks
       );
       o_state.o_webgl_program?.o_ctx.uniform4f(o_state.o_ufloc__o_col_avgrms,
           ...o_state.a_n_rgba_color_amp_avg
       );
       o_state.o_webgl_program?.o_ctx.uniform1f( o_state.o_ufloc__n_sec_time,
           n_sec_of_the_day_because_utc_timestamp_does_not_fit_into_f32_value
       );
       o_state.o_webgl_program?.o_ctx.uniform1f( o_state.o_ufloc__b_show_playhead,
           o_state.b_show_playhead
       );
       o_state.o_webgl_program?.o_ctx.uniform1f( o_state.o_ufloc__b_show_playhead,
           (o_state.n_nor_playhead != null) ? 1 : 0
       );
       o_state.o_webgl_program?.o_ctx.uniform1f( o_state.o_ufloc__n_nor_playhead,
           o_state.n_nor_playhead
       );
       o_state.o_webgl_program?.o_ctx.uniform1f( o_state.o_ufloc__n_amp_peaks,
           o_state.n_amp_peaks
       );
       o_state.o_webgl_program?.o_ctx.uniform1f( o_state.o_ufloc__n_amp_avgrms,
           o_state.n_amp_avgrms
       );
   
       let n_ms = globalThis.performance.now()
       o_state.n_ms_auto_rendering_delta = Math.abs(
           o_state.n_ms_auto_rendering_last - n_ms
       );
       
       o_state.n_ms_auto_rendering_fps = o_state.n_ms_auto_rendering_delta / 1000;

       f_resize_canvas_from_o_webgl_program(
           o_state.o_webgl_program,
           o_state.n_scl_x_canvas, 
           o_state.n_scl_y_canvas
       )
   
       o_state.o_webgl_program?.o_ctx.uniform2f(o_state.o_ufloc__o_scl_canvas,
           o_state.n_scl_x_canvas, 
           o_state.n_scl_y_canvas
       );

       o_state.n_ms_auto_rendering_last = n_ms;

       f_render_from_o_webgl_program(o_state.o_webgl_program);
   }

   o_state.f_raf = function(){
       o_state.f_render();
       o_state.n_id_raf = requestAnimationFrame(o_state.f_raf)
   }

   // if(o_state.o_webgl_program){
   //     f_delete_o_webgl_program(o_state.o_webgl_program)
   // }


   o_state.o_webgl_program = f_o_webgl_program(
       o_state.o_canvas,
       `#version 300 es
       in vec4 a_o_vec_position_vertex;
       void main() {
           gl_Position = a_o_vec_position_vertex;
       }`, 
       `#version 300 es
       precision mediump float;
       in vec2 o_trn_nor_pixel;
       out vec4 fragColor;
       uniform vec4 o_trn_mouse;
       uniform vec4 o_col_peaks;
       uniform vec4 o_col_avgrms;
       uniform float n_sec_time;
       uniform vec2 o_scl_canvas;
       uniform vec4 o_date;
       uniform float b_show_playhead;
       uniform float n_nor_playhead;
       uniform float n_amp_peaks;
       uniform float n_amp_avgrms;
   
       uniform sampler2D o_audio_texture_channel0;  // Waveform data passed as a texture
       uniform vec2 o_scl_audio_texture_channel0;

       void main() {
           float n_scl_min = min(o_scl_canvas.x, o_scl_canvas.y);
           float n_scl_max = max(o_scl_canvas.x, o_scl_canvas.y);
           vec2 o_trn = (gl_FragCoord.xy-o_scl_canvas.xy*.5)/n_scl_min;
           vec2 o_trn2 = gl_FragCoord.xy/o_scl_canvas.xy;
           float n_idx_max = o_scl_audio_texture_channel0.x*o_scl_audio_texture_channel0.y;
           float n_idx2 = o_trn2.x*n_idx_max;
           float n_trn_x_texture = mod(n_idx2, o_scl_audio_texture_channel0.x);
           float n_trn_y_texture = floor(n_idx2 / o_scl_audio_texture_channel0.x);

           // Get the normalized pixel coordinates (0 to 1 for X and Y)
           float x = gl_FragCoord.x / o_scl_canvas.x;
           float y = gl_FragCoord.y / o_scl_canvas.y;
           vec4 o_pixel = texelFetch(o_audio_texture_channel0, ivec2(n_trn_x_texture, n_trn_y_texture), 0);
           float n_amp_min = (o_pixel[0]-.5)*2.;
           float n_amp_max = (o_pixel[1]-.5)*2.;
           float n_amp_avgrms = (o_pixel[2]-.5)*2.;
           n_amp_min *= n_amp_peaks;
           n_amp_max *= n_amp_peaks;
           n_amp_avgrms *= n_amp_avgrms;
           float n_range = n_amp_max - n_amp_min;
           float n_range_amp = n_range*n_amp_peaks; 
           float n_diff_y_max_amp = (abs(o_trn.y) - abs(n_amp_max));
           float n_diff_y_min_amp = (abs(o_trn.y) - abs(n_amp_min));
           float n_diff_y_avgrms = (abs(o_trn.y) - abs(n_amp_avgrms));
           float b = float(o_trn.y > 0.);
           float n_y_peaks = 1.-(b*step(0.01, n_diff_y_max_amp)+(1.-b)*step(0.01, n_diff_y_min_amp));
           float n_y_avgrms = 1.-step(0.01, n_diff_y_avgrms);
           vec4 o_wave_col_peaks = n_y_peaks*o_col_peaks;
           vec4 o_wave_col_avgrms = n_y_avgrms*o_col_avgrms;

           vec4 o_col_wave = o_wave_col_peaks;
           o_col_wave *= (1.-n_y_avgrms);
           o_col_wave += o_wave_col_avgrms;
           fragColor = o_col_wave;

           if(b_show_playhead == 1.0){
               
               float n_d_playhead = abs(o_trn2.x - n_nor_playhead);
               float n_d_playhead_thin = smoothstep(0.0, (1./o_scl_canvas.x   )*1., n_d_playhead);
               n_d_playhead = smoothstep(0.0, (1./o_scl_canvas.x   )*10., n_d_playhead);
               fragColor *= n_d_playhead;
               fragColor += (1.-n_d_playhead)*vec4(1.-o_col_wave.rgb, fragColor.a);
               fragColor += (1.-n_d_playhead_thin);//*vec4(.1,0.,0., 0.1);
           }
       }
       `
   )
   
   o_state.o_ufloc__o_scl_canvas = o_state.o_webgl_program?.o_ctx.getUniformLocation(o_state.o_webgl_program?.o_shader__program, 'o_scl_canvas');
   o_state.o_ufloc__o_col_peaks = o_state.o_webgl_program?.o_ctx.getUniformLocation(o_state.o_webgl_program?.o_shader__program, 'o_col_peaks');
   o_state.o_ufloc__o_col_avgrms = o_state.o_webgl_program?.o_ctx.getUniformLocation(o_state.o_webgl_program?.o_shader__program, 'o_col_avgrms');
   // o_state.o_ufloc__o_date = o_state.o_webgl_program?.o_ctx.getUniformLocation(o_state.o_webgl_program?.o_shader__program, 'o_date');
   // o_state.o_ufloc__o_trn_mouse = o_state.o_webgl_program?.o_ctx.getUniformLocation(o_state.o_webgl_program?.o_shader__program, 'o_trn_mouse');
   o_state.o_ufloc__n_sec_time = o_state.o_webgl_program?.o_ctx.getUniformLocation(o_state.o_webgl_program?.o_shader__program, 'n_sec_time');
   o_state.o_ufloc__b_show_playhead = o_state.o_webgl_program?.o_ctx.getUniformLocation(o_state.o_webgl_program?.o_shader__program, 'b_show_playhead');
   o_state.o_ufloc__n_nor_playhead = o_state.o_webgl_program?.o_ctx.getUniformLocation(o_state.o_webgl_program?.o_shader__program, 'n_nor_playhead');
   o_state.o_ufloc__n_amp_peaks = o_state.o_webgl_program?.o_ctx.getUniformLocation(o_state.o_webgl_program?.o_shader__program, 'n_amp_peaks');
   o_state.o_ufloc__n_amp_avgrms = o_state.o_webgl_program?.o_ctx.getUniformLocation(o_state.o_webgl_program?.o_shader__program, 'n_amp_avgrms');
   o_state.o_ufloc__o_audio_texture_channel0 = o_state.o_webgl_program.o_ctx.getUniformLocation(
       o_state.o_webgl_program.o_shader__program,
       'o_audio_texture_channel0'
   );
   o_state.o_ufloc__o_scl_audio_texture_channel0 = o_state.o_webgl_program?.o_ctx.getUniformLocation(
       o_state.o_webgl_program?.o_shader__program, 'o_scl_audio_texture_channel0');

   o_state.o_texture = o_state.o_webgl_program?.o_ctx.createTexture();

   o_state.f_update_texture_data = function() {
       let gl = o_state.o_webgl_program.o_ctx;
   
       let n_scl_x_texture = 1920;
       let n_scl_y_texture = Math.ceil((o_state.n_scl_x_canvas) / n_scl_x_texture);
   
       // Calculate the start and end indices
       let n_idx_start = Math.floor(o_state.n_nor_start * o_state.a_n_f32_audio_sample.length);
       let n_idx_end = Math.floor(o_state.n_nor_end * o_state.a_n_f32_audio_sample.length);
       n_idx_end = Math.min(n_idx_end, o_state.a_n_f32_audio_sample.length);
   
       // Adjust the number of samples to process
       let n_total_samples = n_idx_end - n_idx_start;
       let n_total_pixels = n_scl_x_texture * n_scl_y_texture;
   
       let a_n_u8_audio_data_new = new Uint8Array(n_total_pixels * 4);
   
       let n_samples_per_subsample = n_total_samples / n_total_pixels;
   
       for (let n = 0; n < n_total_pixels; n += 1) {
           const n_idx_start2 = n_idx_start + Math.floor(n * n_samples_per_subsample);
           const n_idx_end2 = n_idx_start + Math.floor((n + 1) * n_samples_per_subsample);
   
           let n_f32_sum = 0.;
           let n_f32_count = 0.;
   
           let n_f32_min = 1.;
           let n_f32_max = -1.;
   
           for (let n_idx2 = n_idx_start2; n_idx2 < n_idx_end2; n_idx2 += 1) {
               if (n_idx2 >= n_idx_end) break;
               let n_f32 = o_state.a_n_f32_audio_sample[n_idx2];
               n_f32_sum += n_f32 * n_f32;
               n_f32_count += 1.;
               n_f32_min = Math.min(n_f32_min, n_f32);
               n_f32_max = Math.max(n_f32_max, n_f32);
           }
   
           let n_f32_avgrms = Math.sqrt(n_f32_sum / n_f32_count);
           let n_u8_min = Math.floor((n_f32_min + 1) * 127.5);
           let n_u8_max = Math.floor((n_f32_max + 1) * 127.5);
           let n_u8_avgrms = Math.floor((n_f32_avgrms + 1) * 127.5);
   
           a_n_u8_audio_data_new[n * 4 + 0] = n_u8_min;
           a_n_u8_audio_data_new[n * 4 + 1] = n_u8_max;
           a_n_u8_audio_data_new[n * 4 + 2] = n_u8_avgrms;
           a_n_u8_audio_data_new[n * 4 + 3] = 255;  // Alpha channel
       }
       // console.log({a_n_u8_audio_data_new,a_n_f32_audio_sample:o_state.a_n_f32_audio_sample})

       // Bind and update the texture
       gl.activeTexture(gl.TEXTURE0); // Activate texture unit 0
       gl.bindTexture(gl.TEXTURE_2D, o_state.o_texture);
       gl.texImage2D(
           gl.TEXTURE_2D, 0, gl.RGBA, n_scl_x_texture, n_scl_y_texture, 0,
           gl.RGBA, gl.UNSIGNED_BYTE, a_n_u8_audio_data_new
       );
   
       // Set texture parameters
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

       // Update uniforms
       gl.uniform2f(o_state.o_ufloc__o_scl_audio_texture_channel0, n_scl_x_texture, n_scl_y_texture);
       gl.uniform1i(o_state.o_ufloc__o_audio_texture_channel0, 0); // Texture unit 0
   
       // Update last known values
       o_state.n_nor_start__last = o_state.n_nor_start;
       o_state.n_nor_end__last = o_state.n_nor_end;
   };
   // o_state.f_update_texture_data = function(){
   //        /// 

   // let gl = o_state.o_webgl_program.o_ctx;
   // let texture = gl.createTexture();
   // gl.bindTexture(gl.TEXTURE_2D, texture);
   
   // let n_scl_x_texture = 1920;
   // let n_scl_y_texture = Math.ceil((n_scl_x_canvas)/n_scl_x_texture);

   // let a_n_u8_audio_data_new = new Uint8Array(n_scl_x_texture*n_scl_y_texture*4);
   // // we take at max n_scl_x*n_scl_y samples and put them into a 2d textrue.

   // o_state.o_ufloc__o_scl_audio_texture_channel0 = o_state.o_webgl_program?.o_ctx.getUniformLocation(
   //     o_state.o_webgl_program?.o_shader__program, 'o_scl_audio_texture_channel0');

   // o_state.o_webgl_program?.o_ctx.uniform2f(o_state.o_ufloc__o_scl_audio_texture_channel0,
   //     n_scl_x_texture, 
   //     n_scl_y_texture
   // );

   // let n_f32_sum = 0.;
   // let n_f32_count = 0.;
   // let n_idx_a_n_u8_audio_data_new = 0;
   // let n_samples_per_subsample = o_state.a_n_f32_audio_sample.length / (a_n_u8_audio_data_new.length/4);
   // let n_samples_per_subsample_floor = Math.floor(n_samples_per_subsample);
   // // original length 10443406
   // // new array length 1920*1080 = 
   // // samples per new sample = 10443406÷(1920×1080) = 5.036364776
   // let n_f32_range = 0.;
   // let n_f32_min = 0.;
   // let n_f32_max = 0.;
   // for(let n = 0; n < a_n_u8_audio_data_new.length; n+=1){

   //     let n_nor = n / a_n_u8_audio_data_new.length;
   //     const n_idx_start = Math.floor(n * n_samples_per_subsample);
   //     const n_idx_end = Math.floor((n + 1) * n_samples_per_subsample);
   //     n_f32_sum = 0.;
   //     n_f32_count = 0.;

   //     n_f32_min = 1.;
   //     n_f32_max = -1.;
   //     for(let n_idx2 = n_idx_start;n_idx2 <n_idx_end;n_idx2+=1){
   //         let n_f32 = o_state.a_n_f32_audio_sample[n_idx2];
   //         n_f32_sum += n_f32*n_f32;
   //         n_f32_count += 1.;
   //         n_f32_min = Math.min(n_f32_min, n_f32);
   //         n_f32_max = Math.max(n_f32_max, n_f32);
   //     }
   //     n_f32_range = n_f32_max-n_f32_min;
   //     let n_f32_avgrms = Math.sqrt(n_f32_sum / n_f32_count);
   //     let n_u8_min = Math.floor((n_f32_min + 1) * 127.5);
   //     let n_u8_max = Math.floor((n_f32_max + 1) * 127.5);
   //     let n_u8_avgrms = Math.floor((n_f32_avgrms + 1) * 127.5);
   //     // n_u8 = parseInt((n_f32_range/2.)*255);
   //     a_n_u8_audio_data_new[n*4.+0] = n_u8_min;
   //     a_n_u8_audio_data_new[n*4.+1] = n_u8_max;
   //     a_n_u8_audio_data_new[n*4.+2] = n_u8_avgrms;
   //     // a_n_u8_audio_data_new[n*4.+3] = n_u8;

   // }
   // console.log({a_n_u8_audio_data_new})

   // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, n_scl_x_texture, n_scl_y_texture, 0, gl.RGBA, gl.UNSIGNED_BYTE, a_n_u8_audio_data_new);
   // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
   // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

   // o_state.o_ufloc__o_audio_texture_channel0 = o_state.o_webgl_program.o_ctx.getUniformLocation(
   //     o_state.o_webgl_program.o_shader__program,
   //     'o_audio_texture_channel0'
   // );
   // o_state.o_webgl_program.o_ctx.uniform1i(
   //     o_state.o_ufloc__o_audio_texture_channel0,
   //     0
   // );  // 0 corresponds to TEXTURE0
   // }

   o_state.f_update_texture_data();

   o_state.f_render();
   return o_state;
}
let s_name_attr_prop_sync = 'a_s_prop_sync'; 
let o_el_global_event = null;
globalThis.o_el_global_event = o_el_global_event

let f_update_element_to_match = function(o_el_to_copy_attributes_from, o_el_to_update) {

   // Copy all attributes from the new element to the existing element
   for (const attr of o_el_to_copy_attributes_from.attributes) {
       o_el_to_update.setAttribute(attr.name, attr.value);
   }
   
   // Remove any attributes on the existing element that are not on the new element
   for (const attr of o_el_to_update.attributes) {
       if (!o_el_to_copy_attributes_from.hasAttribute(attr.name)) {
       o_el_to_update.removeAttribute(attr.name);
       }
   }
   
   // Replace the inner content of the existing element with the new element's content
   o_el_to_update.innerHTML = o_el_to_copy_attributes_from.innerHTML;
   
   // If you need to copy other properties (e.g., event listeners), you can do so here
   // Example: existingElement.onclick = newElement.onclick;

}
function f_b_numeric(str) {
   if (typeof str != "string") return false // we only process strings!  
   return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
          !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
 }

 let f_try_to_update_input_select_or_checkbox_element = function(
    o_el_html, 
    v_value
 ){
    // 4. Update element based on type
    if (o_el_html.type === 'checkbox' || o_el_html.type === 'radio') {
        o_el_html.checked = !!v_value;
    } else {
        o_el_html.value = v_value != null ? v_value.toString() : '';
    }
 }
 const f_try_to_update_element_from_params = function(
    o_el_html, 
    o_state,
    s_path
) {
    
    // 1. Check if element is input
    // if (!(o_el_html instanceof HTMdLInputElement)) return;

    // 2. Split path into components
    const a_s_path_part = s_path.split('.');
    
    // 3. Get value from state
    const v_value = f_v_from_path(o_state, a_s_path_part);
    // 4. Update element based on type
    if (o_el_html.type === 'checkbox' || o_el_html.type === 'radio') {
        o_el_html.checked = !!v_value;
    } else {
        o_el_html.value = v_value != null ? v_value.toString() : '';
    }
};

// Helper function with path traversal
const f_v_from_path = function(o_state, a_s_path_part) {
    let o_current = o_state;
    
    for (const s_part of a_s_path_part) {
        if (typeof o_current !== 'object' || o_current === null || !(s_part in o_current)) {
            return undefined;
        }
        o_current = o_current[s_part];
    }
    
    return o_current;
};



let f_o_html_from_o_js = async function(
   o_js,
   o_state = {}
   ){
    o_js = await o_js;

    if(o_state == undefined || o_state == null){
        throw Error('please pass a state object (o_state) to the function "f_o_html_from_o_js" as a second argument ')
    }
   // debugger
   let s_tag = 'div';
   if(o_js?.s_tag){
       s_tag = o_js.s_tag
   }
   if(typeof o_js?.[s_name_attr_prop_sync] == 'string'){
        o_js[s_name_attr_prop_sync] = [o_js?.[s_name_attr_prop_sync]];
   }
   let o_html = await f_o_html_element__from_s_tag(s_tag);
   for(let s_prop in o_js){
       let v = o_js[s_prop];
       

       let s_type_v = typeof v;
       let s_prop_function_possible = s_prop.replace('f_s_', '');
       let b_a_s_name_rendered_prop_includes = s_prop.startsWith('f_s_');
       if(s_type_v == "function" && !b_a_s_name_rendered_prop_includes){
           let f_event_handler = function(){
               v.call(this, ...arguments, o_js);
           }


           o_html[s_prop] = f_event_handler
           if(!o_html.o_meta){
               o_html.o_meta = {o_js, o_state}
           }
           o_html.o_meta[s_prop] = v
           continue
          
       }

        // if the value is a function, we have to evaluate it
        if(b_a_s_name_rendered_prop_includes && s_type_v == "function" ){
            v = o_js?.[`${s_prop}`]?.() || v;
            s_prop = s_prop_function_possible
        }
        // some attributes such as 'datalist' do only have a getter

        try {
            o_html.setAttribute(s_prop, v);
        } catch (error) {
            console.warn(error)
        }
        try {
            o_html[s_prop] = v;
        } catch (error) {
            console.warn(error)
        }
       

   }


   
   if(o_js?.f_a_o || o_js?.a_o){
       let a_o = [];
       if(o_js?.f_a_o){
           a_o = await o_js?.f_a_o();
       }
       if(o_js?.a_o){
            a_o = o_js?.a_o;
       }
       a_o = await Promise.all(a_o);
       for(let o_js2 of a_o){
           let n_idx = a_o.indexOf(o_js2);
           let o_html2 = await f_o_html_from_o_js(o_js2, o_state);
           o_html.appendChild(o_html2)

       }
   }

   let s_path = o_js?.[s_name_attr_prop_sync]?.[0];
   if(!o_html.o_meta){
    o_html.o_meta = {
        o_js, 
        o_state
    }
   }
   if(s_path){
       let o_state = o_html?.o_meta?.o_state;
       f_try_to_update_element_from_params(
        o_html, 
        o_state, 
        s_path
       );
   }


   if(o_js?.f_b_render?.() === false){
        // let o_html2 = document.createComment('b_render')
        let o_html2 = await f_o_html_element__from_s_tag('div');
        o_html2.style.display = 'none';
        // let o_html2 = await f_o_html_element__from_s_tag('div')
        // // just let the content be empty, but the attributes are still required like 'a_s_prop_sync'
        // debugger
        f_update_element_to_match(o_html,o_html2)
        o_html2.innerHTML = ''
        o_html2.o_meta = {o_js, o_state}
        return o_html2;
    }
    if(o_js?.f_after_render){
        o_js.f_after_render(o_html)
    }

   return o_html;
}
const f_b_object_or_array = (value) => {
    return (value !== null && typeof value === 'object'&& !Array.isArray(value)) || Array.isArray(value);
  };
let f_set_by_path_with_type = function(obj, s_prop_path, value) {
   const a_s_prop_path_part = s_prop_path.split('.');
   let o_current = obj;
 
   // Traverse to the parent of the target property
   for (let i = 0; i < a_s_prop_path_part.length - 1; i++) {
     const s_prop_path_part = a_s_prop_path_part[i];
     if (o_current && typeof o_current === 'object' && s_prop_path_part in o_current) {
       o_current = o_current[s_prop_path_part]; // Move deeper into the object
     } else {
       throw new Error(`Invalid s_prop_path: ${s_prop_path}`); // If any part of the path is invalid, throw an error
     }
   }
 
   // Get the target property name (last part of the path)
   const s_prop_path_part_target = a_s_prop_path_part[a_s_prop_path_part.length - 1];
 
   // Check if the target property exists
   if (o_current && typeof o_current === 'object' && s_prop_path_part_target in o_current) {
     const v_current = o_current[s_prop_path_part_target];
     const s_type_current = typeof v_current;
 
     // Convert the new value to the same type as the current value
     let v_new;
     switch (s_type_current) {
       case 'number':
         v_new = Number(value);
         if (isNaN(v_new)) {
           throw new Error(`Cannot convert "${value}" to a number.`);
         }
         break;
       case 'string':
         v_new = String(value);
         break;
       case 'boolean':
         v_new = Boolean(value);
         break;
       default:
         throw new Error(`Unsupported type: ${v_current}`);
     }
 
     // Set the new value
     o_current[s_prop_path_part_target] = v_new;
   //   console.log(`Value set successfully at path "${s_prop_path}". New value:`, v_new);
   } else {
     throw new Error(`Property at path "${s_prop_path}" does not exist.`);
   }
 }

 let f_handle_input_change = function(o_ev, o_state) {
   o_el_global_event = o_ev.target;

   // console.log(`Event "${event.type}" triggered on:`, event.target);
   let a_s_prop_sync = o_ev.target.getAttribute(s_name_attr_prop_sync)?.split(',');

   if(a_s_prop_sync){
       for(let s_prop_sync of a_s_prop_sync){
           let a_s = s_prop_sync.split('.');
           let value;
           // Check if the input is a checkbox
           if (o_ev.target.type === 'checkbox') {
               value = o_ev.target.checked; // Use the checked property for checkboxes
           } else {
               value = o_ev.target.value; // Use the value property for other input types
           }
           f_set_by_path_with_type(o_state, s_prop_sync,value)
       }
   }
   o_el_global_event = null;

   // console.log('Input value changed:', o_ev.target.value);
 }

 let s_cancel_msg = 'Cancelled_by_f_cancel_call'
 let f_o_promise_and_cancelfunction = function(f_executor) {
    let f_cancel;
    const o_promise = new Promise((resolve, reject) => {
      f_cancel = () => {
        reject(new Error(s_cancel_msg));
      };
      f_executor(resolve, reject, f_cancel);
    });
    
    return { o_promise, f_cancel };
  }
  const getLastNumberPart = (path) => {
    // Match the last number and optionally the string after it
    const match = path.match(/(\d+)(\.[^\.]+)?$/);
    if (!match) return null; // No number found
  
    // Return the number and the optional string after it
    return match[1] + (match[2] || '');
  };


  const f_o_proxified = function (
    v_target, 
    f_callback_beforevaluechange = (a_s_path, v_old, v_new)=>{},
    f_callback_aftervaluechange = (a_s_path, v_old, v_new)=>{},
    o_div = document,
    a_s_prop_path_part = []
 
 ) {
     let o_state_readable = {}
 
     let f_async_callback = async function(
         v_target,
         a_s_path,
         v_old,
         v_new,
         a_n_idx_array_item__removed,
         a_n_idx_array_item__added,
         n_idx_array_item__modified,
         signal, 
         o_div = document
      ){
 
         let s_path = a_s_path.join('.')
         let a_s_path_with_n = a_s_path.map(v => {
            // Check if the v is a number (either as a number or a string that can be parsed to an integer)
            if (typeof v === 'number' && Number.isInteger(v)) {
              return '[n]';
            } else if (typeof v === 'string' && !isNaN(v) && Number.isInteger(Number(v))) {
              return '[n]';
            } else {
              return v;
            }
          });
          let a_o_el_original = Array.from(document.querySelectorAll(`[${s_name_attr_prop_sync}]`)).map(o_el => {
            let a_s_path = o_el.getAttribute(s_name_attr_prop_sync)?.split(','); 
            return {
                o_el, 
                a_s_path,
            }
          }); 

        let a_o_el = []
         let b_object_or_array = f_b_object_or_array(v_new);
         if(b_object_or_array){
            a_o_el = a_o_el_original.filter(o=>{
                return o?.a_s_path.find(s_path2 =>{
                    return s_path2.startsWith(s_path)
                }) != undefined
            })
         }else{
            a_o_el = a_o_el_original.filter(o=>{
                return o.a_s_path.find(s_path2 =>{
                    return s_path2 == (s_path)
                }) != undefined
            })
         }
         let a_tmp = a_s_path_with_n.slice(); // clone a_s_path_with_n
         while(a_tmp.length > 0 && a_tmp.includes('[n]')){
            let s_path3 = a_tmp.join('.');
            a_o_el.push(
                ...a_o_el_original.filter(o=>{
                    return o?.a_s_path.find(s_path2 =>{
                        return s_path2.startsWith(s_path3)
                    }) != undefined
                })
            )
            a_tmp.pop();
         }

         a_o_el = a_o_el.filter(o=>{
             return o != o_el_global_event
         });
         
         for(let o2 of a_o_el){
            let o_el = o2.o_el;
             // console.log(`o_el.o_meta.b_rendering: ${o_el.o_meta.b_rendering}`)
             if(o_el.o_meta?.f_cancel_rendering && o_el.o_meta.b_rendering === true){
                 await o_el.o_meta?.f_cancel_rendering();
                 o_el.o_meta.b_rendering = false;
             }else{
                 let o = f_o_promise_and_cancelfunction(
                     async (f_resolve, f_reject, f_onCancel)=>{
 
                         o_el.o_meta.b_rendering = true;
                         let b_render = o_el?.o_meta?.o_js?.f_b_render?.();
                         if(b_render === false){
                             // o_el.style.display = 'none';
                             let o_el2 = await f_o_html_from_o_js(o_el?.o_meta?.o_js, o_el?.o_meta?.o_state); 
                             o_el.replaceWith(o_el2)
                             f_resolve(true);
                         }
                         if(b_render === true){
                             let o_el2 = await f_o_html_from_o_js(o_el?.o_meta?.o_js, o_el?.o_meta?.o_state); 
                             o_el.replaceWith(o_el2)
                             f_resolve(true);
                             
                         }
                         if(o_el == o_el_global_event){
                             f_resolve(true);
                             
                         }
                         f_try_to_update_input_select_or_checkbox_element(
                             o_el, 
                             v_new
                         )

                         for(let s_prop in o_el.o_meta?.o_js){
                             if(s_prop.startsWith('f_s_') && o_el.o_meta?.o_js[s_prop] && typeof o_el.o_meta?.o_js[s_prop] == 'function'){
                                let f = o_el.o_meta?.o_js[s_prop];
                                let v = f();
                                o_el[s_prop.replace('f_s_', '')] = v;
                             }
                             if(o_el.o_meta?.o_js?.f_after_update){
                                await o_el.o_meta?.o_js?.f_after_update(o_el);
                            }
                         }
                            
                        if(o_el?.o_meta?.f_a_o || o_el?.o_meta?.a_o){
                            let a_o = [];
                            if(o_el?.o_meta?.f_a_o){
                                a_o = await o_el?.o_meta?.f_a_o();
                            }
                            if(o_js?.a_o){
                                a_o = o_el?.o_meta?.a_o;
                            }
                             // console.log(o.o_meta)
                             // debugger
                  
                             // console.log(`starting: ${new Date().getTime()}`)
                             // console.log(o_el.o_meta.b_done)
                  
                             let a_o_js = a_o;
                             // console.log('a_o_js')
                             // console.log(a_o_js)
                  
                             // we always have to render the full array
                             // since there could also be a 'static' html object in f_a_o that is not part of the array of the proxy. 
             
                             // for(let n_idx_array_item__removed of a_n_idx_array_item__removed){
                             //      o_el.removeChild(o_el.children[n_idx_array_item__removed]);
                             // }
                             // for(let n_idx_array_item__added of a_n_idx_array_item__added){
                             //      let o_el2 = await f_o_html_from_o_js(a_o_js[n_idx_array_item__added], o_el?.o_meta?.o_state);
                             //      o_el.insertBefore(o_el2, o_el.childNodes[n_idx_array_item__added+1]);
                             // }
                             // if(!isNaN(n_idx_array_item__modified)){
                             //      let o_el2 = await f_o_html_from_o_js(a_o_js[n_idx_array_item__modified], o_el?.o_meta?.o_state);
                             //      f_update_element_to_match(
                             //          o_el2,
                             //          o_el.childNodes[n_idx_array_item__modified]
                             //      )
                             // }
                             
                             // if(
                             //      (
                             //         //  Array.isArray(v_old) && Array.isArray(v_new)
                             //         //  &&
                             //          a_n_idx_array_item__removed.length == 0
                             //          && 
                             //          a_n_idx_array_item__added.length == 0
                             //          &&
                             //          isNaN(n_idx_array_item__modified)
                             //      )
                             //     ){
                                     o_el.innerHTML = ''
                                     for(let n_idx in a_o_js){
                                         let o_js2 = a_o_js[n_idx];
                                         let o_html2 = await f_o_html_from_o_js(o_js2, o_el?.o_meta?.o_state);
                                         o_el.appendChild(o_html2)
                                         if(o_js2?.f_after_render){
                                             await o_js2?.f_after_render(o_html2);
                                         }
                                         // console.log('appending child')
                                         // console.log(o_html2)
                                     }
                             // }
             
                  
                         }
                         
                         f_resolve(true);
 
                     }
                 )
                 o_el.o_meta.f_cancel_rendering = o.f_cancel
                 try {
                     await o.o_promise;
                     // if(o_el?.o_meta?.o_js?.f_after_render){
                     //     await o_el?.o_meta?.o_js?.f_after_render(o_el);
                     // }
 
                 } catch (error) {
                     if (error.message === s_cancel_msg) {
                         console.warn('it may be that your element is trying to be rendered before it has finished rendering!')
                         // Ignore the 'Cancelled' error
                         return;
                     }
                 }
                 o_el.o_meta.b_rendering = false;
 
             }
 
         }
      }
      
    // i want to be able to trigger a async function 'f_async_callback' when a possibly nested object gets manipulated in any way. 
    // the function should receive the following parameters.
    // also if f_async_callback has already called and has not yet ended (can take up to 2 sec) 
    // if it will get called again the last call of it should be canceled
    // remember that i want to be able to monitor all changes on the object which could be 
    // example: 
 
    // o = f_o_proxified({n:2});
 
    // o.n = 3 // this change should trigger the 'f_async_callback'
    // o.o_nested = {n:1} // this should also add a proxy on o.o_nested  
    // o.o_nested.n = 55 // this should also trigger the 'f_async_callback'
    
    // o.a = [1,2,3,4,{n:9}] 
    // now for arrays those are a bit special in javascript i guess
    // so a normal change would be 
    // o.a[2] = 22
    // but also those functions should trigger the callback 'f_async_callback' but only once !
    // o.a.push(99)
    // o.a.pop()
    // o.a.splice(2, 0, "Lemon", "Kiwi"); // At position 2, add "Lemon" and "Kiwi":
    // o.a = o.a.filter((v)=>{return !isNaN(v)})
    // when any array manipulation happens the according parameters should be 
    // built, the possible parameters are 
    // a_n_idx_array_item_removed // an array with the indices of the removed elements 
    // a_n_idx_array_item_added // an array with the indices of the added elements
    // n_idx_array_item_modified // the index of the array item that has been modified
    // so for example 
    // o.a[3] = 11 // n_idx_array_item_modified would be 3
    // o.a[3] = {n:9} // n_idx_array_item_modified would be also 3
    // o.a.push() // a_n_idx_array_item_added would be [{last_index_of_array_depending_on_array_size}]
    // o.a.splice(5, 0, item);// a_n_idx_array_item_added would be [5]
    // i dont know if this is even possible  
    // but i assume one can not find out what indices are removed if for example 
    // a .map  function is used on the array, it is not possible
    // to know what of the new items are the same as the old items
    // but this is ok. in this case a_n_idx_array_item_removed and a_n_idx_array_item_added 
    // would just be an empty array 
    // o.a = o.a.filter((v)=>{return isNaN(v)})
 
 
 
    // so basically there are three ways to manipulate an array
    // 1. directly manipulate an item by using an index, a[n_idx] = 2
    // 2. using 'helper?' functions like .pop() .shift() .splice() etc. 
    // 3. reassigning by using filter or map like a = a.filter(...)
 
 
    // so in the 'f_async_callback' there should be the following parameters passed to it
    // 'v_target' // the target if for example o.o2.n = 2 the target would be the object o.o2
    // 'a_s_prop_path_part' an array containing strings that represent the path of manipulated object
    //        so for example o.o2.o_nested.a[5] = {n:9} , would be ['o','o2','o_nested','a','5']
    //           for example o.o2.o_nested.a.splice(2, 0, "Lemon", "Kiwi");, would be ['o','o2','o_nested','a']
    // 'v_old' // the old value 
    // 'v_new' // the new value
 
    // are there more edge cases i did not consider?
 
    // stick to the following coding conventions  
    // variable names all have prefixes
    // v_ => 'value' a variable with a 'unknown' type
    // n_ => numnbers , eg. a.map((n_idx, v)=>{...})
    // b_ => boolean 
    // o_ => object
    // a_ => array
    // f_ => functions, yes also functions are variables, like let f_test = ()=>{return 'test'}
    // define all functions with a variable declaration keyword for example 
    // let f_test = function(){return 'test'}
    // a_n_ => an array containing numbers eg. [1,2,3]
    // a_o_ => an array containing objects eg. [{},{},{}]
    // s_f_ => a string that is a function that then could be used in 
    // new Function or eval 
    // s_f_test = `return 'test'`, ->new Function(s_f_test);
    // s_json__o_person = JSON.stringify(o_person), would be a object o_person in json / string format
    // an exeption: if objects with same structure are needed ofen times classes are used, 
    // but instead of having classes we have functions in this style 
    // f_O_person = function(s_name, n_age){return {s_name, n_age}}
    // this would return an object that represents a person. the equivalent of a class would be 
    //   class O_person {
    //     constructor(s_name, n_age) {
    //       this.s_name = s_name;
    //       this.n_age = n_age;
    //     }
    //   }
    // but like i said a simple function is preferred!
    // if a function returns a certain type this prefix comes at second place for example
    // f_a_n_=> a function that returns an array of numbers like let f_a_n_test = () =>{return [1,2,3]}
    
 
    // another important this is , the plural form of words has to be omitted completly
    // example: 'hans' would be the value, we could use 's_name' as a variable name
    // ['hans', 'gretel', 'ueli', 'jasmin'] would be the value 
    // 'a_s_name' would be the variable name, since this is an array of names, 
    // so 'a_s_names' is wrong, it is an array 'a_', containing 's_name' variables, so 'a_s_name'! 
 
    // the last thing: try to always 'group' variable names, so if the values are similar but the variable names 
    // have to be distinguished always use the basic / more general variable name in front of it , for example 
 
    // let o_person__hans = new O_person('hans', 20);
    // let o_person__gretel = new O_person('gretel', '19'); 
 
    // more exmaples
    // for example an id is a very generic term so it comes first
    // n_timeout_id wrong, correct: n_id__timeout
    // n_frame_id wrong, correct: n_id__frame
    // n_start_index wrong, correct: n_idx__start, respectively n_idx__end 
    // n_timestamp_ms wrong, correct: n_ms__timestamp, or n_sec__timestamp or n_min__timestamp
    
 
    // thats all, now solve my problem
    if (typeof v_target !== 'object' || v_target === null) return v_target;
 
    
    const a_s_array_methods = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];
    const o_map_proxies = new WeakMap();
    let o_pending_async_callback = null;
 
    const f_wrap_array_method = function (
        o_array_target, 
        s_method_name, 
        a_args, 
        a_s_prop_path_part, 
    ) {
        const f_original_method = Array.prototype[s_method_name];
        const a_v_array_old = [...o_array_target];
        const n_array_length_old = a_v_array_old.length;
        const v_result = f_original_method.apply(o_array_target, a_args);
        const a_v_array_new = [...o_array_target];
        const n_array_length_new = a_v_array_new.length;
 
        let a_n_idx_array_item__removed = [];
        let a_n_idx_array_item__added = [];
        let n_idx_array_item__modified = undefined;
 
        switch (s_method_name) {
            case 'push':
                a_n_idx_array_item__added = Array.from(
                    { length: a_args.length }, 
                    (_, n_idx) => n_array_length_old + n_idx
                );
                break;
            case 'pop':
                if (n_array_length_old > 0) a_n_idx_array_item__removed = [n_array_length_old - 1];
                break;
            case 'shift':
                if (n_array_length_old > 0) a_n_idx_array_item__removed = [0];
                break;
            case 'unshift':
                a_n_idx_array_item__added = Array.from({ length: a_args.length }, (_, n_idx) => n_idx);
                break;
            case 'splice': {
                const n_start_idx = a_args[0] < 0 
                    ? Math.max(n_array_length_old + a_args[0], 0) 
                    : Math.min(a_args[0], n_array_length_old);
                const n_delete_count = a_args[1] || 0;
                a_n_idx_array_item__removed = Array.from(
                    { length: Math.min(n_delete_count, n_array_length_old - n_start_idx) },
                    (_, n_idx) => n_start_idx + n_idx
                );
                a_n_idx_array_item__added = Array.from(
                    { length: a_args.length - 2 },
                    (_, n_idx) => n_start_idx + n_idx
                );
                break;
            }
            default: {
                const a_n_idx_modified = [];
                for (let n_idx = 0; n_idx < Math.max(n_array_length_old, n_array_length_new); n_idx++) {
                    if (a_v_array_old[n_idx] !== a_v_array_new[n_idx]) {
                        a_n_idx_modified.push(n_idx);
                    }
                }
                if (a_n_idx_modified.length > 0) n_idx_array_item__modified = a_n_idx_modified[0];
                break;
            }
        }
 
        f_async_callback(
            o_array_target,
            a_s_prop_path_part,
            a_v_array_old,
            a_v_array_new,
            a_n_idx_array_item__removed,
            a_n_idx_array_item__added,
            n_idx_array_item__modified, 
        );
 
        return v_result;
    };
 
    const f_create_proxy_handler = function (a_s_prop_path_part, o_div = document) {
        return {
            get: function (o_target, s_prop) {
                const v_value = Reflect.get(...arguments);
 
                if (Array.isArray(o_target) && a_s_array_methods.includes(s_prop)) {
                    return (...a_args) => f_wrap_array_method(o_target, s_prop, a_args, a_s_prop_path_part, o_div);
                }
 
                if (typeof v_value === 'object' && v_value !== null) {
                    return f_o_proxified(
                        v_value,
                        f_callback_beforevaluechange,
                        f_callback_aftervaluechange, 
                        o_div,
                        a_s_prop_path_part.concat(s_prop), 
                    );
                }
 
                return v_value;
            },
            set: function (o_target, s_prop, v_value) {
                const v_old_value = o_target[s_prop];
                const a_s_full_prop_path = a_s_prop_path_part.concat(s_prop);
 
                const v_new_proxified = f_o_proxified(
                    v_value,
                    f_callback_beforevaluechange,
                    f_callback_aftervaluechange,
                    o_div,
                    a_s_full_prop_path
                );
 
                f_callback_beforevaluechange(a_s_full_prop_path, v_old_value, v_new_proxified);
                const b_success = Reflect.set(o_target, s_prop, v_new_proxified);
                f_callback_aftervaluechange(a_s_full_prop_path, v_old_value, v_new_proxified);
 
                if (b_success) {
                    const a_n_idx_array_item__removed = [];
                    const a_n_idx_array_item__added = [];
                    let n_idx_array_item__modified = undefined;
 
                    if (Array.isArray(o_target) && typeof s_prop === 'string' && !isNaN(s_prop)) {
                        n_idx_array_item__modified = parseInt(s_prop, 10);
                    }
 
                    let s_prop2 = a_s_full_prop_path?.at(-2);
                     if(!isNaN(s_prop2)){
                         n_idx_array_item__modified = Number(s_prop2)
                     }
 
                    f_async_callback(
                        o_target,
                        a_s_full_prop_path,
                        v_old_value,
                        v_new_proxified,
                        a_n_idx_array_item__removed,
                        a_n_idx_array_item__added,
                        n_idx_array_item__modified, 
                    );
                }
 
                return b_success;
            }
        };
    };
 
    if (o_map_proxies.has(v_target)) return o_map_proxies.get(v_target);
 
    const o_proxy_handler = f_create_proxy_handler(a_s_prop_path_part);
    const o_proxy = new Proxy(v_target, o_proxy_handler);
    o_map_proxies.set(v_target, o_proxy);
    o_state_readable = o_proxy
    return o_proxy
 
 };
let f_v_from_path_dotnotation = function(path, obj) {
    if(path.trim()==''){return obj}
    // Split the path by dots to get the individual keys
    const keys = path.split('.');

    // Iterate through the keys to traverse the object
    let current = obj;
    for (const key of keys) {
        // Check if the current value is an array and the key is a number (array index)
        if (Array.isArray(current) && !isNaN(key)) {
            current = current[parseInt(key)]; // Access the array index
        } else if (current && typeof current === 'object' && key in current) {
            current = current[key]; // Access the object property
        } else {
            // If the key doesn't exist or the path is invalid, return undefined
            return undefined;
        }
    }

    // Return the final value
    return current;
}

// let f_traverse_nested_object = function(
//     o_target,
//     a_s_prop_path_part = [],
//     f_callback = (a_s_prop_path_part, v_value) => {}
// ) {
//     // First call callback for current node
//     f_callback(a_s_prop_path_part, o_target);

//     // Process object/array children recursively
//     if (typeof o_target === 'object' && o_target !== null) {
//         for (const s_key of Object.keys(o_target)) {
//             const a_s_path_new = [...a_s_prop_path_part, s_key];
//             const v_child_value = o_target[s_key];
            
//             f_traverse_nested_object(
//                 v_child_value,
//                 a_s_path_new,
//                 f_callback
//             );
//         }
//     }
// };
// let f_traverse_nested_object_and_initialize_values = function(
//     o, 
// ){
//     f_traverse_nested_object(
//         o, 
//         [], 
//         (a_s_path_tmp, v_value)=>{
//             let s_path = a_s_path_tmp.join('.')
//             const a_o_el2 = document.querySelectorAll(`[${s_name_attr_prop_sync}*="${s_path}"]`);
//             if(s_path == 'a_o_person.0.s_name'){
//                 debugger
//             }
//             const a_o_el__filtered = Array.from(a_o_el2).filter(el => {
//                 const a_s = el.getAttribute(s_name_attr_prop_sync).split(',');
//                 return a_s.includes(s_path) && el != o_el_global_event;
//             });
//             for(let o_el of a_o_el__filtered){
//                 if(o_el.value){
//                     o_el.value = v_value
//                     console.log('o_el.value');
//                     console.log(o_el.value);
//                 }
//                 if(o_el?.o_meta?.f_s_innerText){
//                     let s = o_el.o_meta.f_s_innerText();
//                     o_el.innerText = s;
//                 }
//             }
//         }
//     )
// }
const f_o_proxified_and_add_listeners = function(
    v_target, 
    f_callback_beforevaluechange = (a_s_path, v_old, v_new)=>{},
    f_callback_aftervaluechange = (a_s_path, v_old, v_new)=>{},
    o_div = document,
    a_s_prop_path_part = [], 
){
    let o_proxy = f_o_proxified(
        v_target, 
        f_callback_beforevaluechange, 
        f_callback_aftervaluechange,
        o_div,
        a_s_prop_path_part
    )
    // Attach the event listener to the document or a parent element
    o_div.addEventListener('input', (o_ev) => {
        // Check if the event target is an input, textarea, or select
        if (o_ev.target.matches('input, textarea, select')) {
            f_handle_input_change(o_ev, o_proxy);
        }
    });
    return o_proxy;
}

let  f_s_random_uuid__with_unsecure_fallback = function() {
    if (globalThis.crypto && globalThis.crypto.randomUUID) {
        return globalThis.crypto.randomUUID();
    } else {
        console.warn("⚠️ Warning: Using a less secure UUID generator. Consider using HTTPS for better security.");
        return f_s_random_uuid_unsecure();
    }
}

let f_s_random_uuid_unsecure = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}


let f_o_mod__notifire = async function(){
    
    let s_class_name = `class_${f_s_random_uuid__with_unsecure_fallback()}`;
    let o_div = document.createElement('div');
    // first we define our data in a state object
    let o_state = f_o_proxified_and_add_listeners(
        {
            a_o_message: []
        }, 
        ()=>{},
        ()=>{}, 
        o_div
    )
    let s_css = `
        .o_mod__notifire.${s_class_name}{
            position:fixed; 
            top:0;
            right:0;
            background: red;
        }
        .success label{
            background: #d4edda; /* Soft green */
            color: #155724 !important; /* Dark green */
            border: 1px solid #c3e6cb;
        }
        
        .error label{
            background: #f8d7da; /* Soft red */
            color: #721c24 !important; /* Dark red */
            border: 1px solid #f5c6cb;
        }
        
        .warning label{
            background: #fff3cd; /* Soft yellow */
            color: #856404 !important; /* Dark yellow */
            border: 1px solid #ffeeba;
        }
        .o_message{
            padding: 0.2rem;
            position:relative;
        }
        .bar{
            position:absolute;
            height: 1px;
            top:0;
            left:0;
            z-index:0;
            background: red;
        }
        .text{
            z-index:1;
            background: transparent;
        }
    `
    let o_html = await f_o_html_from_o_js(
        {
            class: `o_mod__notifire ${s_class_name}`,
            f_a_o: ()=>{
                return o_state.a_o_message
                    .map(
                        o=>{
                            
                            return {     
                                class: [`o_message`,o.s_class].join(' '),          
                                style: `display: ${(o.b_show) ? 'block': 'none'}`,     
                                f_a_o: ()=>{
                                    return [
                                        {
                                            class: "text",
                                            s_tag: "label",
                                            f_s_innerText:()=>{
                                                return o.s
                                            }, 
                                        }, 
                                        {
                                            class: 'bar',
                                            style: `width:${parseInt((o.n_ms/o.n_ms__max)*100)}%`
                                        }

                                    ]
                                }
                            }
                        }
                    )
            }, 
            a_s_prop_sync: 'a_o_message'
        }, 
        o_state
    )
    o_div.appendChild(o_html);
    let f_push_message = function(
        s, 
        n_ms__max,
        s_class,
    ){
        let o_message = {
            b_show: true, 
            s: s,
            s_class, 
            n_ms:0,
            n_ms__max, 
            n_id_interval: 0
        };
        o_state.a_o_message.push(o_message)
        o_message = o_state.a_o_message.at(-1);//get the proxy reference

        let n_ms_interval = 100;
        // o_message.n_ms = 200;
        // o_message.n_ms__max = 1000;
        o_message.n_id_interval = setInterval(()=>{
            if(o_message.n_ms > o_message.n_ms__max){
                o_message.b_show = false;
                clearInterval(o_message.n_id_interval)
            };
            o_message.n_ms+=n_ms_interval
        },n_ms_interval)

    }
    let o = {
        o_div, 
        o_state, 
        f_message_success: function(s, n_ms__max = 3000){f_push_message(s,n_ms__max, 'success')}, 
        f_message_error: function(s, n_ms__max = 3000){f_push_message(s,n_ms__max, 'error')}, 
        f_message_warning: function(s, n_ms__max = 3000){f_push_message(s,n_ms__max, 'warning')}, 
        s_css
    }
    return o;
}

let f_o_img_cached = async function(s_url, a_o_img=[]){
    let s_url_absolute = new URL(s_url, window.location.href).href;
    return new Promise(
        (f_res, f_rej)=>{

            let o_img__existing = a_o_img.find(
                o=>{
                    return o.src == s_url_absolute
                }
            )
            if(document){
                let o_img__existing_in_dom = Array.from(document.querySelectorAll('img')).find(o=>{
                    o.src == s_url_absolute
                });
                if(o_img__existing_in_dom){
                    return f_res(o_img__existing_in_dom);
                }
            }
            if(o_img__existing){
                return f_res(o_img__existing);
            }
            if(!o_img__existing){
                // Create a new Image object
                const o_img = new Image();
    
                // Set the src attribute to load the image
                o_img.src = s_url_absolute;
    
                // Optional: Add event listeners for when the image loads or fails
                o_img.onload = () => {
                    a_o_img.push(o_img)
                    return f_res(o_img)
                    // console.log("Image loaded successfully!");
                    // You can now append the image to the DOM or use it in other ways
                };
    
                o_img.onerror = (o_err) => {
                    return f_rej(o_err)
                    console.error("Failed to load the image.");
                };
            }
        }
    )
};

let f_o_mod__image_gallery = async function(
    o_state
){
    
    let a_o_image = []

    let s_class_name = `class_${f_s_random_uuid__with_unsecure_fallback()}`;
    let o_div = document.createElement('div');
    Object.assign(
        o_state, 
        {
            n_render_images: 0,
            a_s_url_image: (o_state.a_s_url_image) ? o_state.a_s_url_image : [
                //provide an array of image urls here
                // './images/jonas-frey-1IWoSFH-Oog-unsplash.jpg',
                // './images/jonas-frey-cqbAPdIs0QA-unsplash.jpg',
                // './images/jonas-frey-d8AgCj2epJc-unsplash.jpg',
            ],
            n_images_per_x: (o_state.n_images_per_x) ? o_state.n_images_per_x : 3,
            n_scl_x_parent: 0,
        }, 
    );
    o_state = f_o_proxified_and_add_listeners(
        o_state,
        ()=>{
            // debugger
        },
        function(){
            // console.log(...arguments)
            // debugger
        }, 
        o_div
    )

    let s_css = `
        .o_mod__image_gallery.${s_class_name}{
            overflow-y: scroll;
            overflow-x:hidden;
            position:relative;

        }
        .o_mod__image_gallery.${s_class_name} img{
        }
        
    `
    let f_o_img_info = function(o_img){
        let n_ratio_x_to_y = o_img.naturalWidth / o_img.naturalHeight;
        let o_el_parent = document.querySelector(`.${s_class_name}`)?.parentElement;
        let o_bounds = o_el_parent?.getBoundingClientRect();
        let n_width = (o_bounds?.width) ? o_bounds?.width : 1000;
        console.log(o_bounds)
        let n_scl_x = n_width / o_state.n_images_per_x;
        let n_scl_y = n_scl_x * (1./n_ratio_x_to_y);

        return {
            n_scl_x, 
            n_scl_y, 
            n_ratio_x_to_y
        }
    }
    let f_recalculate_images = function(){
        
        
        let a_o_img = Array.from(document.querySelectorAll(`.${s_class_name} img`));
        console.log(a_o_img);
        let n_trn2_y_max = 0;
        for(let n_idx in a_o_img){
            let o = a_o_img[n_idx];
            
            n_idx = parseInt(n_idx);
            let n_idx_above = n_idx-o_state.n_images_per_x;
            let n_trn_y = 0;
            o.o_data = f_o_img_info(o);
            if(n_idx_above >= 0){
                let o_img_above = a_o_img[n_idx_above];
                n_trn_y = o_img_above.o_data.n_trn_y +o_img_above.o_data.n_scl_y;
            }
            o.o_data.n_trn_x = (n_idx%o_state.n_images_per_x)*o.o_data.n_scl_x;
            o.o_data.n_trn_y = n_trn_y;

            o.style.width = `${o.o_data.n_scl_x}px`
            o.style.height = `${o.o_data.n_scl_y}px`
            o.style.left = `${o.o_data.n_trn_x}px`
            o.style.top = `${o.o_data.n_trn_y}px`
            let n_trn2_y = o.o_data.n_scl_y+o.o_data.n_trn_y;
            if(n_trn2_y > n_trn2_y_max){
                n_trn2_y_max = n_trn2_y
            }
        }
        let o2 = document.querySelector(`.${s_class_name}`);
        if(o2){
            o2.style.height = n_trn2_y_max + "px";
        }
        // debugger

    }
    window.onresize = function(){
        f_recalculate_images();

    }
    let o_js = {
        class: `o_mod__image_gallery ${s_class_name}`,
        f_a_o: async ()=>{

            return [                    
                ...o_state.a_s_url_image.map(async (s)=>{
                    // we have to make sure the image is loaded...
                    let o = await f_o_img_cached(s, a_o_image);
                    return {
                        s_tag: "img", 
                        src: s,
                        style: [
                            `position:absolute`,
                        ].join(';')
                    }
                })
            ]
        },
        f_after_render: ()=>{
            f_recalculate_images();
        },
        a_s_prop_sync: ['a_s_url_image', 'n_render_images']
    };
    let o_html = await f_o_html_from_o_js(
        o_js,
        o_state
    );
    o_div.appendChild(o_html);
    let o = {
        o_div, 
        o_state, 
        o_js,
        s_css, 
        f_recalculate_images
    }
    return o;
}

let f_a_o_img__gallery_from_a_o_img = function(
    a_o_img, 
    n_scl_x_px_container,
    n_images_per_x,
    n_px_margin_x,
    n_px_margin_y,

){
    for(let n_idx in a_o_img){
        let o_img = a_o_img[n_idx];
        n_idx = parseInt(n_idx);
        let n_idx_above = n_idx-n_images_per_x;
        let n_trn_y = 0;

        let n_ratio_x_to_y = o_img.naturalWidth / o_img.naturalHeight;
        let n_scl_x = (n_scl_x_px_container / n_images_per_x)-n_px_margin_x;
        let n_scl_y = (n_scl_x * (1./n_ratio_x_to_y));

        if(n_idx_above >= 0){
            let o_img_above = a_o_img[n_idx_above];
            n_trn_y = o_img_above.o_data_img_gal.n_trn_y + o_img_above.o_data_img_gal.n_scl_y + n_px_margin_y;
        }
        let n_trn_x = (n_idx%n_images_per_x)*(n_scl_x + n_px_margin_x);

        o_img.o_data_img_gal = {
            n_scl_x, 
            n_scl_y, 
            n_ratio_x_to_y, 
            n_trn_x, 
            n_trn_y
        }
    }
    return a_o_img
}

let f_a_o_img__gallery_from_a_s_url = async function(
    a_s_url,
    n_scl_x_px_container,
    n_images_per_x,
    n_px_margin_x,
    n_px_margin_y
){
    let a_o_img = await Promise.all(
        a_s_url.map(s_url=>{
            return f_o_img_cached(s_url, [])
        })
    );
    a_o_img = f_a_o_img__gallery_from_a_o_img(
        a_o_img,
        n_scl_x_px_container,
        n_images_per_x,
        n_px_margin_x,
        n_px_margin_y
    );
    return a_o_img;

}

let f_a_o_img__gallery_from_a_s_url_and_resize_images_and_container = async function(
    a_s_url, 
    o_el_container,
    n_images_per_x,
    n_px_margin_x,
    n_px_margin_y,
){

    let o_bounds = o_el_container?.getBoundingClientRect();
    let n_scl_x_px_container = (o_bounds?.width) ? o_bounds?.width : 1000;

    let a_o_img = await f_a_o_img__gallery_from_a_s_url(
        a_s_url, 
        n_scl_x_px_container,
        n_images_per_x,
        n_px_margin_x,
        n_px_margin_y,
    );
    let n_trn_y_max = 0; 

    let a_o_img_existing_in_dom = Array.from(o_el_container.querySelectorAll('img'));
    
    for(let o_img of a_o_img){
        let s_url_absolute = o_img.src;//new URL(s_url, window.location.href).href;
        let o_img_in_dom = a_o_img_existing_in_dom.find(o=>o.src == s_url_absolute);
        if(o_img_in_dom){
            o_img = o_img_in_dom;
        }else{
            o_el_container.appendChild(o_img)
        }
        
        o_img.style.position = `absolute`;
        o_img.style.width = `${o_img.o_data_img_gal.n_scl_x}px`
        o_img.style.height = `${o_img.o_data_img_gal.n_scl_y}px`
        o_img.style.left = `${o_img.o_data_img_gal.n_trn_x}px`
        o_img.style.top = `${o_img.o_data_img_gal.n_trn_y}px`

        let n_trn_y2 = o_img.o_data_img_gal.n_trn_y+o_img.o_data_img_gal.n_scl_y+n_px_margin_y;
        n_trn_y_max = Math.max(n_trn_y2, n_trn_y_max);
    }

    a_o_img.map(o=>{
        o.o_data_img_gal.n_scl_y_px_container = n_trn_y_max;
    })

    o_el_container.style.position = `relative`;
    
    o_el_container.style.height = `${n_trn_y_max}px`;
    // o_bounds = o_el_container?.getBoundingClientRect();
    n_scl_x_px_container = (o_bounds?.width) ? o_bounds?.width : 1000;
    let n_scl_y_px_container = (o_bounds?.width) ? o_bounds?.width : 1000;
    // let n_scl_y_px_container = (o_bounds?.width) ? o_bounds?.width : 1000;
    let n_ratio_y_x = n_scl_y_px_container/n_scl_x_px_container;
    o_el_container.style.height = `auto`
    o_el_container.style.aspectRatio = `1/${n_ratio_y_x}`;
    // o_bounds = o_el_container?.getBoundingClientRect();
    // n_scl_x_px_container = (o_bounds?.width) ? o_bounds?.width : 1000;
    // n_scl_y_px_container = (o_bounds?.width) ? o_bounds?.width : 1000;
    for(let o_img of a_o_img){

        // o_img.style.position = `absolute`;
        // o_img.style.aspectRatio = `${o_img.o_data_img_gal.n_scl_x/o_img.o_data_img_gal.n_scl_y}/1`
        o_img.style.width = `${(o_img.o_data_img_gal.n_scl_x/n_scl_x_px_container)*100}%`
        o_img.style.height = `${(o_img.o_data_img_gal.n_scl_y/n_scl_x_px_container)*100}%`
        o_img.style.left = `${(o_img.o_data_img_gal.n_trn_x/n_scl_x_px_container)*100}%`
        o_img.style.top = `${(o_img.o_data_img_gal.n_trn_y/n_scl_y_px_container)*100}%`

        let n_trn_y2 = o_img.o_data_img_gal.n_trn_y+o_img.o_data_img_gal.n_scl_y+n_px_margin_y;
        n_trn_y_max = Math.max(n_trn_y2, n_trn_y_max);
    }
    return a_o_img;

}

let o_state_a_o_logmsg = {
    a_o_logmsg: []
};      
let f_o_toast = function(
    s_message, 
    s_class = 'info', 
    n_ms = 5000
){
    let s_uuidv4 = f_s_uuidv4();
    let o_toast = {
        s_uuidv4, 
        s_class: `o_toast ${s_class}`,
        s_message_init: s_message, 
        s_message: s_message, 
        b_render: true,
        n_id_interval: 0,
    };
    o_state.a_o_logmsg.push(o_toast);

    let o = o_state.a_o_logmsg.find(o=>{return o.s_uuidv4 == s_uuidv4})
    o.f_hide = function(){
        o.b_render = false;
        clearInterval(o.n_id_interval);
        o_state.a_o_logmsg = o_state.a_o_logmsg.filter((o, n_idx)=>{
            let b = o.s_uuidv4 != s_uuidv4
            return b
        });
    }
    window.setTimeout(()=>{
        o.f_hide();
    },n_ms)
    
    if(s_class == 'loading'){
        o.n_id_interval = window.setInterval(()=>{
            let a_s_char_spinner = ['|', '/', '-', '\\'];
            a_s_char_spinner = ['◴', '◷', '◶', '◵']
            a_s_char_spinner = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏']
            let n = (parseInt(window.performance.now()*0.007)%a_s_char_spinner.length);
            o.s_message = `${o.s_message_init} ${a_s_char_spinner[n]}`
        }, 100)
    }
    return o
}
let s_css_a_o_logmsg = `
.a_o_logmsg {
    position:fixed;
    top: 1rem;
    right: 1rem;
    left: auto;
    width: auto;
    max-width: 90%;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    pointer-events: none;
}

.o_toast {
    padding: 0.75rem 1.25rem;
    border-radius: 0.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-size: 0.95rem;
    pointer-events: all;
    animation: fadeSlideIn 0.3s ease-out;
}

.o_toast{
    padding: .5rem;
}
.o_toast.info, .o_toast.loading{
    background:rgba(103, 111, 218, 0.6);
    color: #fff;
}
.o_toast.warning{
    background:rgba(235, 140, 62, 0.6);
    color: #fff;
}
.o_toast.error{
    background:rgba(218, 103, 111, 0.6);
    color: #fff;
}`
let f_o_js_a_o_logmsg = function(o_state){
    let o_js_a_o_logmsg = {
        f_a_o:async ()=> [
            {
                a_s_prop_sync: 'a_o_logmsg',
                class: 'a_o_logmsg',
                f_a_o: ()=>{
                    return o_state.a_o_logmsg.map((o, n_idx)=>{
                        
                        // console.log(sp)
                        return {
                            class: o.s_class, 
                            f_s_innerText: ()=>{return o.s_message},
                            f_b_render: ()=>{return o.b_render},
                            onclick: ()=>{
                                o_state.a_o_logmsg = o_state.a_o_logmsg.filter((o2, n_idx2)=>{
                                    return n_idx != n_idx2
                                })
                            },
                            a_s_prop_sync: [
                                `a_o_logmsg.${n_idx}.s_message`,
                            ],
                        }
                    })
                }
            },
    
        ],
        a_s_prop_sync: 'a_s_name',
    }
    return o_js_a_o_logmsg
}


let f_s_image_url_from_s_text = function(
    s_text, 
    n_font_size_px = 16,
    n_padding_factor = 0.5,
    n_outline_factor = 0.05, 
    s_color_font = 'black', 
    s_color_background = 'transparent', // Default to transparent background
    s_color_outline = 'white',
){
    let o_canvas = document.createElement('canvas');
    let o_ctx = o_canvas.getContext('2d');

    let n_padding_px = n_font_size_px * n_padding_factor;
        
    o_ctx.font = `${n_font_size_px}px sans-serif`;
    let n_text_width = o_ctx.measureText(s_text).width;
    let n_text_height = n_font_size_px; // Approximate height based on font size
    o_canvas.width = n_text_width + n_padding_px; // Add some padding
    o_canvas.height = n_text_height + n_padding_px; // Add some padding
    

    // fill text outline color 

    let n_px_baseline_compensation = n_font_size_px * 0.2; // Adjust for baseline compensation
    // Draw text - position it slightly above center (y position is the baseline)
    let n_trn_x = n_padding_px / 2;
    let n_trn_y = (n_padding_px / 2) + n_font_size_px - n_px_baseline_compensation; // Adjust for baseline

    // fill background color
    o_ctx.fillStyle = s_color_background;
    o_ctx.fillRect(0, 0, o_canvas.width, o_canvas.height);
    o_ctx.font = `${n_font_size_px}px Arial`;
    if(n_outline_factor > 0){
        o_ctx.strokeStyle = s_color_outline;
        o_ctx.lineWidth = n_font_size_px *n_outline_factor;
        o_ctx.strokeText(s_text, n_trn_x, n_trn_y);
    }
    // Draw text
    o_ctx.fillStyle = s_color_font;
    o_ctx.fillText(s_text, n_trn_x, n_trn_y);

    // Convert the canvas to a data URL
    let s_data_url = o_canvas.toDataURL('image/png');
    // Clean up
    o_canvas.remove();
    return s_data_url;

}



export {
   f_o_empty_recursive,
   f_a_n_nor__rgb__from_a_n_nor__hsl,
   f_a_n_nor__hsl__from_a_n_nor__rgb,
   f_b_uuid,
   f_s_uuidv4,
   f_v_s__between,
   f_o_cpu_stats,
   f_s_n_beautified,
   f_a_v__recursive, 
   f_b_denojs, 
   f_o_html_element__from_s_tag, 
   f_o_html__from_s_html,
   f_o_html__from_s_url,
   f_a_n_u8__from_s_url_with_download_speed_easy,
   f_download_file__from_s_url, 
   f_o_resp__fetch_cached, 
   f_s_hashed,
   f_o__from_o_fetch_response, 
   f_s_name_file_cached__readable_ignore_fragment_and_getparams,
   f_s_name_file_cached__hashed,
   f_s_name_file_cached__base64encoded,
   f_sleep_ms, 
   f_move_in_array, 
   f_swap_in_array,
   f_n_idx_ensured_inside_array, 
   f_move_v_in_array, 
   f_swap_v_in_array, 
   f_a_a_v__combinations, 
   a_o_cpu_stats, 
   f_o_cpu_stats__diff, 
   f_s_type__from_typed_array, 
   f_download_text_file, 
   f_s_type_mime__from_s_extension, 
   f_o_meminfo, 
   f_o_nvidia_smi_help_info, 
   f_o_nvidia_smi_info, 
   f_o_number_value__from_s_input,
   f_a_o_number_value_temperature_from_s_temp,
   f_v_at_n_idx_relative, 
   f_v_s_type__from_value, 
   f_v_s_type_from_array,
   f_o_image_data_from_s_url,
   f_a_v_add_v_circular_to_array, 
   f_dd, 
   f_ddd,
   f_o_object_assign_nested, 
   f_b_check_type_and_potentially_throw_error, 
   f_a_n_u8_from_s_b64, 
   f_a_n_trn__relative_to_o_html,
   f_a_n_trn__relative_to_o_html__nor,
   f_a_o_entry__from_s_path, 
   f_s_bordered, 
   f_s_color_rgba_from_a_n_nor_channelcolorrgba,
   f_s_color_hex_from_a_n_nor_channelcolorrgba, 
   f_a_n_nor_channelcolorrgba_from_color_hex, 
   f_o_webgl_program,
   f_delete_o_webgl_program,
   f_resize_canvas_from_o_webgl_program,
   f_render_from_o_webgl_program, 
   f_o_data_from_google_sheet,
   f_o_google_sheet_data_from_o_resp_data, 
   f_o_state_webgl_shader_audio_visualization,
   f_o_proxified,
   f_o_proxified_and_add_listeners,
   f_o_html_from_o_js, 
   f_download_file_denojs, 
   f_s_random_uuid__with_unsecure_fallback,
   f_s_random_uuid_unsecure, 
   f_v_from_path_dotnotation,
   f_o_mod__notifire, 
   f_o_mod__image_gallery,
   f_o_img_cached,
   f_a_o_img__gallery_from_a_s_url_and_resize_images_and_container, 
   f_o_shader_info_and_compile_shader,
   o_state_a_o_logmsg,
   f_o_toast,
   s_css_a_o_logmsg,
   f_o_js_a_o_logmsg,
   f_s_image_url_from_s_text
}

