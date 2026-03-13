class O_nvidia_smi_section{
    constructor(
        s_title, 
        s_description, 
        a_o_nvidia_smi_metric
    ){
        this.s_title = s_title, 
        this.s_description = s_description
        this.a_o_nvidia_smi_metric = a_o_nvidia_smi_metric
    }
}
class O_nvidia_smi_metric{
    constructor(
        a_s_name, 
        s_description
    ){
        this.a_s_name = a_s_name, 
        this.s_description = s_description
    }
}
class O_nvidia_smi_help_info{
    constructor(
        a_o_nvidia_smi_metric, 
        a_o_nvidia_smi_section
    ){
        this.a_o_nvidia_smi_metric = a_o_nvidia_smi_metric
        this.a_o_nvidia_smi_section = a_o_nvidia_smi_section
    }
}
class O_number_value{
    constructor(
        s_original, 
        s_name_unit_matched,
        s_name_unit_base,
        a_s_name_unit_alterative_matched,
        n_nano,
        n_micro, 
        n_milli, 
        n_centi, 
        n_deci, 
        n, 
        n_kilo, 
        n_kibi,
        n_mega, 
        n_mebi, 
        n_giga,
        n_gibi, 
        n_tera, 
        n_tebi, 
        n_peta, 
        n_peti

    ){
        this.s_original = s_original, 
        this.s_name_unit_matched = s_name_unit_matched
        this.s_name_unit_base = s_name_unit_base
        this.a_s_name_unit_alterative_matched = a_s_name_unit_alterative_matched, 
        this.n_nano = n_nano,
        this.n_micro = n_micro, 
        this.n_milli = n_milli, 
        this.n_centi = n_centi, 
        this.n_deci = n_deci, 
        this.n = n, 
        this.n_kilo = n_kilo, 
        this.n_kibi = n_kibi,
        this.n_mega = n_mega, 
        this.n_mebi = n_mebi, 
        this.n_giga = n_giga,
        this.n_gibi = n_gibi, 
        this.n_tera = n_tera, 
        this.n_tebi = n_tebi, 
        this.n_peta = n_peta, 
        this.n_peti = n_peti
    }
}

class O_cpu_stats__diff{
    constructor(
        o_cpu_stats_1, 
        o_cpu_stats_2, 
    ){

        if(
            o_cpu_stats_1.n_ms_window_performance_now < o_cpu_stats_2.n_ms_window_performance_now
        ){
            this.o_cpu_stats_old = o_cpu_stats_1
            this.o_cpu_stats_new = o_cpu_stats_2
        }else{
            this.o_cpu_stats_old = o_cpu_stats_2
            this.o_cpu_stats_new = o_cpu_stats_1
        }

        this.n_diff_n_ts_ms = 
            this.o_cpu_stats_new.n_ts_ms
            - this.o_cpu_stats_old.n_ts_ms
        this.n_diff_n_ms_window_performance_now = 
            this.o_cpu_stats_new.n_ms_window_performance_now
            - this.o_cpu_stats_old.n_ms_window_performance_now
        this.n_diff_n_conf_clk_tck = 
            this.o_cpu_stats_new.n_conf_clk_tck
            - this.o_cpu_stats_old.n_conf_clk_tck
        this.n_diff_n_total_context_switches_across_all_cpus = 
            this.o_cpu_stats_new.n_total_context_switches_across_all_cpus
            - this.o_cpu_stats_old.n_total_context_switches_across_all_cpus
        this.n_diff_n_ts_ms_ut__booted = 
            this.o_cpu_stats_new.n_ts_ms_ut__booted
            - this.o_cpu_stats_old.n_ts_ms_ut__booted
        this.n_diff_n_processes_and_threads_created = 
            this.o_cpu_stats_new.n_processes_and_threads_created
            - this.o_cpu_stats_old.n_processes_and_threads_created
        this.n_diff_n_processes_running = 
            this.o_cpu_stats_new.n_processes_running
            - this.o_cpu_stats_old.n_processes_running
        this.n_diff_n_processes_blocked_waiting_for_io_to_complete = 
            this.o_cpu_stats_new.n_processes_blocked_waiting_for_io_to_complete
            - this.o_cpu_stats_old.n_processes_blocked_waiting_for_io_to_complete



        
        this.a_o_cpu_core_stats__diff =this.o_cpu_stats_old.a_o_cpu_core_stats.map(
            (o_old, n_idx) =>{

                let o_cpu_core_stats__diff = new O_cpu_core_stats__diff(
                    o_old,
                    this.o_cpu_stats_new.a_o_cpu_core_stats[n_idx]
                )
                return o_cpu_core_stats__diff
            }
        )


    }
}
class O_cpu_core_stats__diff{
    // the cpu usage can be read out for a certain timespan
    // because in the /proc/stat file there are time values 
    // the values must be readout twice , with the difference 
    // of the values the cpu usage of the last n-milliseconds
    // can be calculated
    // the default milliseconds is chosen very short so that 
    constructor(
        o_cpu_core_stats_1, 
        o_cpu_core_stats_2, 
    ){
        if(
            o_cpu_core_stats_1.n_ms_window_performance_now 
            < o_cpu_core_stats_2.n_ms_window_performance_now){
            this.o_cpu_core_stats_old = o_cpu_core_stats_1
            this.o_cpu_core_stats_new = o_cpu_core_stats_2
        }else{
            this.o_cpu_core_stats_old = o_cpu_core_stats_2
            this.o_cpu_core_stats_new = o_cpu_core_stats_1
        }


        this.n_diff_n_conf_clk_tck = 
            this.o_cpu_core_stats_new.n_conf_clk_tck
            - this.o_cpu_core_stats_old.n_conf_clk_tck
        this.n_diff_n_ts_ms = 
            this.o_cpu_core_stats_new.n_ts_ms
            - this.o_cpu_core_stats_old.n_ts_ms
        this.n_diff_n_ms_window_performance_now = 
            this.o_cpu_core_stats_new.n_ms_window_performance_now
            - this.o_cpu_core_stats_old.n_ms_window_performance_now
        this.n_diff_n_ms_time_spent_since_boot_processes_executing_in_user_mode = 
            this.o_cpu_core_stats_new.n_ms_time_spent_since_boot_processes_executing_in_user_mode
            - this.o_cpu_core_stats_old.n_ms_time_spent_since_boot_processes_executing_in_user_mode
        this.n_diff_n_ms_time_spent_since_boot_niced_processes_executing_in_user_mode = 
            this.o_cpu_core_stats_new.n_ms_time_spent_since_boot_niced_processes_executing_in_user_mode
            - this.o_cpu_core_stats_old.n_ms_time_spent_since_boot_niced_processes_executing_in_user_mode
        this.n_diff_n_ms_time_spent_since_boot_processes_executing_in_kernel_mode = 
            this.o_cpu_core_stats_new.n_ms_time_spent_since_boot_processes_executing_in_kernel_mode
            - this.o_cpu_core_stats_old.n_ms_time_spent_since_boot_processes_executing_in_kernel_mode
        this.n_diff_n_ms_time_spent_since_boot_idle = 
            this.o_cpu_core_stats_new.n_ms_time_spent_since_boot_idle
            - this.o_cpu_core_stats_old.n_ms_time_spent_since_boot_idle
        this.n_diff_n_ms_time_spent_since_boot_io_wait = 
            this.o_cpu_core_stats_new.n_ms_time_spent_since_boot_io_wait
            - this.o_cpu_core_stats_old.n_ms_time_spent_since_boot_io_wait
        this.n_diff_n_ms_time_spent_since_boot_servicing_interrupts = 
            this.o_cpu_core_stats_new.n_ms_time_spent_since_boot_servicing_interrupts
            - this.o_cpu_core_stats_old.n_ms_time_spent_since_boot_servicing_interrupts
        this.n_diff_n_ms_time_spent_since_boot_servicing_softirqs = 
            this.o_cpu_core_stats_new.n_ms_time_spent_since_boot_servicing_softirqs
            - this.o_cpu_core_stats_old.n_ms_time_spent_since_boot_servicing_softirqs


        this.n_diff_n_ms_time_total = 0
            +this.n_diff_n_ms_time_spent_since_boot_processes_executing_in_user_mode
            +this.n_diff_n_ms_time_spent_since_boot_niced_processes_executing_in_user_mode
            +this.n_diff_n_ms_time_spent_since_boot_processes_executing_in_kernel_mode
            +this.n_diff_n_ms_time_spent_since_boot_idle
            +this.n_diff_n_ms_time_spent_since_boot_io_wait
            +this.n_diff_n_ms_time_spent_since_boot_servicing_interrupts
            +this.n_diff_n_ms_time_spent_since_boot_servicing_softirqs

        this.n_diff_idle = 0
            +this.n_diff_n_ms_time_spent_since_boot_idle
            +this.n_diff_n_ms_time_spent_since_boot_io_wait

        if(this.n_diff_n_ms_time_total == 0){
            this.n_usage_nor = 0
        }else{
            this.n_usage_nor = Math.abs(1-(this.n_diff_idle/this.n_diff_n_ms_time_total))
            // console.log(this)
        }
    }
}
class O_cpu_stats{
    constructor(
        s_proc_stat,
        n_conf_clk_tck,
        n_total_context_switches_across_all_cpus,
        n_ts_ms_ut__booted, 
        n_processes_and_threads_created,
        n_processes_running,
        n_processes_blocked_waiting_for_io_to_complete,
        s_softirqs,
        a_o_cpu_core_stats, 
        o_cpu_core_stats__total, 
    ){
        this.a_o_cpu_stats = [];
        this.s_proc_stat = s_proc_stat,
        this.n_ts_ms = new Date().getTime()
        this.n_ms_window_performance_now = globalThis.performance.now()
        this.n_conf_clk_tck = n_conf_clk_tck,
        this.n_total_context_switches_across_all_cpus = n_total_context_switches_across_all_cpus,
        this.n_ts_ms_ut__booted = n_ts_ms_ut__booted, 
        this.n_processes_and_threads_created = n_processes_and_threads_created,
        this.n_processes_running = n_processes_running,
        this.n_processes_blocked_waiting_for_io_to_complete = n_processes_blocked_waiting_for_io_to_complete,
        this.s_softirqs = s_softirqs,
        this.a_o_cpu_core_stats = a_o_cpu_core_stats
        this.o_cpu_core_stats__total = o_cpu_core_stats__total
        //getconf CLK_TCK
    }
    get n_cpus(){
        return this.a_o_cpu_core_stats.length
    }
}
class O_cpu_core_stats{
    constructor(
        s,
        n_conf_clk_tck,
        n_ts_ms, 
        n_ms_window_performance_now,
        n_ms_time_spent_since_boot_processes_executing_in_user_mode,
        n_ms_time_spent_since_boot_niced_processes_executing_in_user_mode,
        n_ms_time_spent_since_boot_processes_executing_in_kernel_mode,
        n_ms_time_spent_since_boot_idle, 
        n_ms_time_spent_since_boot_io_wait,
        n_ms_time_spent_since_boot_servicing_interrupts,
        n_ms_time_spent_since_boot_servicing_softirqs
    ){
        this.s = s
        this.n_conf_clk_tck = n_conf_clk_tck
        this.n_ts_ms = n_ts_ms
        this.n_ms_window_performance_now = n_ms_window_performance_now
        this.n_ms_time_spent_since_boot_processes_executing_in_user_mode = n_ms_time_spent_since_boot_processes_executing_in_user_mode,
        this.n_ms_time_spent_since_boot_niced_processes_executing_in_user_mode = n_ms_time_spent_since_boot_niced_processes_executing_in_user_mode,
        this.n_ms_time_spent_since_boot_processes_executing_in_kernel_mode = n_ms_time_spent_since_boot_processes_executing_in_kernel_mode,
        this.n_ms_time_spent_since_boot_idle = n_ms_time_spent_since_boot_idle, 
        this.n_ms_time_spent_since_boot_io_wait = n_ms_time_spent_since_boot_io_wait,
        this.n_ms_time_spent_since_boot_servicing_interrupts = n_ms_time_spent_since_boot_servicing_interrupts,
        this.n_ms_time_spent_since_boot_servicing_softirqs = n_ms_time_spent_since_boot_servicing_softirqs
    }
}
class O_meminfo_property{
    constructor(
        s_name,
        s_description, 
        n,
        n_nor_by_mem_total, 
        n_bytes, 
        n_kilobytes,
        n_megabytes, 
        n_gigabytes, 
        n_terrabytes
    ){
        this.s_name = s_name
        this.s_description = s_description, 
        this.n = n
        this.n_nor_by_mem_total = n_nor_by_mem_total,
        this.n_bytes = n_bytes, 
        this.n_kilobytes = n_kilobytes, 
        this.n_megabytes = n_megabytes, 
        this.n_gigabytes = n_gigabytes, 
        this.n_terrabytes = n_terrabytes
    }
}
class O_meminfo{
    constructor(
    ){
        this.n_ts_ms = new Date().getTime()
        this.n_window_performance_now = globalThis.performance.now();
        this.o_meminfo_property_MemTotal = 
        new O_meminfo_property(
            'MemTotal',
            'Total amount of physical RAM available to the system.'
        )
        this.o_meminfo_property_MemFree = 
        new O_meminfo_property(
            'MemFree',
            'Amount of physical RAM left unused by the system.'
        )
        this.o_meminfo_property_memory_used_calculated = 
        new O_meminfo_property(
            'memory_used_calculated',
            'Amount of physical RAM currently in use by the system.'
        )
        this.o_meminfo_property_MemAvailable = 
        new O_meminfo_property(
            'MemAvailable',
            'Estimate of how much memory is available for starting new applications, without swapping.'
        )
        this.o_meminfo_property_Buffers = 
        new O_meminfo_property(
            'Buffers',
            'Memory used by kernel buffers.'
        )
        this.o_meminfo_property_Cached = 
        new O_meminfo_property(
            'Cached',
            'Memory used by the page cache and slabs (Cached and SReclaimable minus Shmem).'
        )
        this.o_meminfo_property_SwapCached = 
        new O_meminfo_property(
            'SwapCached',
            'Memory that once was swapped out, is swapped back in but still also is in the swap file.'
        )
        this.o_meminfo_property_Active = 
        new O_meminfo_property(
            'Active',
            'Memory that has been used more recently and usually not reclaimed unless absolutely necessary.'
        )
        this.o_meminfo_property_Inactive = 
        new O_meminfo_property(
            'Inactive',
            'Memory which has been less recently used. It is more eligible to be reclaimed for other purposes.'
        )
        this.o_meminfo_property_Active_anon_ = 
        new O_meminfo_property(
            'Active_anon_',
            '(anon): Active memory that belongs to anonymous processes.'
        )
        this.o_meminfo_property_Inactive_anon_ = 
        new O_meminfo_property(
            'Inactive_anon_',
            '(anon): Inactive memory that belongs to anonymous processes.'
        )
        this.o_meminfo_property_Active_file_ = 
        new O_meminfo_property(
            'Active_file_',
            '(file): Active memory that belongs to file allocations.'
        )
        this.o_meminfo_property_Inactive_file_ = 
        new O_meminfo_property(
            'Inactive_file_',
            '(file): Inactive memory that belongs to file allocations.'
        )
        this.o_meminfo_property_Unevictable = 
        new O_meminfo_property(
            'Unevictable',
            'Memory that cannot be evicted.'
        )
        this.o_meminfo_property_Mlocked = 
        new O_meminfo_property(
            'Mlocked',
            'Amount of memory locked in RAM.'
        )
        this.o_meminfo_property_SwapTotal = 
        new O_meminfo_property(
            'SwapTotal',
            'Total amount of swap space available.'
        )
        this.o_meminfo_property_SwapFree = 
        new O_meminfo_property(
            'SwapFree',
            'Amount of swap space that is currently unused.'
        )
        this.o_meminfo_property_Zswap = 
        new O_meminfo_property(
            'Zswap',
            'Compressed cache for swap pages.'
        )
        this.o_meminfo_property_Zswapped = 
        new O_meminfo_property(
            'Zswapped',
            'Amount of memory currently swapped, including compressed memory.'
        )
        this.o_meminfo_property_Dirty = 
        new O_meminfo_property(
            'Dirty',
            'Memory which is waiting to get written back to the disk.'
        )
        this.o_meminfo_property_Writeback = 
        new O_meminfo_property(
            'Writeback',
            'Memory which is actively being written back to the disk.'
        )
        this.o_meminfo_property_AnonPages = 
        new O_meminfo_property(
            'AnonPages',
            'Non-file backed pages mapped into user-space page tables.'
        )
        this.o_meminfo_property_Mapped = 
        new O_meminfo_property(
            'Mapped',
            'Files which have been mapped, such as libraries.'
        )
        this.o_meminfo_property_Shmem = 
        new O_meminfo_property(
            'Shmem',
            'Amount of memory consumed in tmpfs (shmem) filesystems.'
        )
        this.o_meminfo_property_KReclaimable = 
        new O_meminfo_property(
            'KReclaimable',
            'Kernel memory that might be reclaimed (slab allocations).'
        )
        this.o_meminfo_property_Slab = 
        new O_meminfo_property(
            'Slab',
            'In-kernel data structures cache.'
        )
        this.o_meminfo_property_SReclaimable = 
        new O_meminfo_property(
            'SReclaimable',
            'Part of Slab that can be reclaimed (such as caches).'
        )
        this.o_meminfo_property_SUnreclaim = 
        new O_meminfo_property(
            'SUnreclaim',
            'Part of Slab that cannot be reclaimed.'
        )
        this.o_meminfo_property_KernelStack = 
        new O_meminfo_property(
            'KernelStack',
            'Memory used by the kernel stack allocations.'
        )
        this.o_meminfo_property_PageTables = 
        new O_meminfo_property(
            'PageTables',
            'Memory used to store page tables.'
        )
        this.o_meminfo_property_SecPageTables = 
        new O_meminfo_property(
            'SecPageTables',
            'Memory used for secondary page tables.'
        )
        this.o_meminfo_property_NFS_Unstable = 
        new O_meminfo_property(
            'NFS_Unstable',
            'NFS pages sent to the server, but not yet committed to stable storage.'
        )
        this.o_meminfo_property_Bounce = 
        new O_meminfo_property(
            'Bounce',
            'Memory used for block device "bounce buffers".'
        )
        this.o_meminfo_property_WritebackTmp = 
        new O_meminfo_property(
            'WritebackTmp',
            'Memory used by FUSE for temporary writeback buffers.'
        )
        this.o_meminfo_property_CommitLimit = 
        new O_meminfo_property(
            'CommitLimit',
            'Total amount of memory currently available to be allocated on the system.'
        )
        this.o_meminfo_property_Committed_AS = 
        new O_meminfo_property(
            'Committed_AS',
            'Total amount of memory estimated to complete the workload.'
        )
        this.o_meminfo_property_VmallocTotal = 
        new O_meminfo_property(
            'VmallocTotal',
            'Total size of vmalloc memory area.'
        )
        this.o_meminfo_property_VmallocUsed = 
        new O_meminfo_property(
            'VmallocUsed',
            'Amount of vmalloc area which is used.'
        )
        this.o_meminfo_property_VmallocChunk = 
        new O_meminfo_property(
            'VmallocChunk',
            'Largest contiguous block of vmalloc area which is free.'
        )
        this.o_meminfo_property_Percpu = 
        new O_meminfo_property(
            'Percpu',
            'Memory used by per-CPU allocations.'
        )
        this.o_meminfo_property_HardwareCorrupted = 
        new O_meminfo_property(
            'HardwareCorrupted',
            'Memory that has been identified as corrupted by the hardware.'
        )
        this.o_meminfo_property_AnonHugePages = 
        new O_meminfo_property(
            'AnonHugePages',
            'Non-file backed huge pages mapped into user-space page tables.'
        )
        this.o_meminfo_property_ShmemHugePages = 
        new O_meminfo_property(
            'ShmemHugePages',
            'Amount of memory used for shared memory (shmem) huge pages.'
        )
        this.o_meminfo_property_ShmemPmdMapped = 
        new O_meminfo_property(
            'ShmemPmdMapped',
            'Amount of shared memory mapped into user-space page tables with huge pages.'
        )
        this.o_meminfo_property_FileHugePages = 
        new O_meminfo_property(
            'FileHugePages',
            'File backed huge pages mapped into user-space page tables.'
        )
        this.o_meminfo_property_FilePmdMapped = 
        new O_meminfo_property(
            'FilePmdMapped',
            'File backed pages mapped into user-space page tables with huge pages.'
        )
        this.o_meminfo_property_HugePages_Total = 
        new O_meminfo_property(
            'HugePages_Total',
            'Total number of huge pages.'
        )
        this.o_meminfo_property_HugePages_Free = 
        new O_meminfo_property(
            'HugePages_Free',
            'Number of free huge pages.'
        )
        this.o_meminfo_property_HugePages_Rsvd = 
        new O_meminfo_property(
            'HugePages_Rsvd',
            'Number of reserved huge pages.'
        )
        this.o_meminfo_property_HugePages_Surp = 
        new O_meminfo_property(
            'HugePages_Surp',
            'Number of surplus huge pages.'
        )
        this.o_meminfo_property_Hugepagesize = 
        new O_meminfo_property(
            'Hugepagesize',
            'Size of each huge page.'
        )
        this.o_meminfo_property_Hugetlb = 
        new O_meminfo_property(
            'Hugetlb',
            'Total size of huge pages of memory.'
        )
        this.o_meminfo_property_DirectMap4k = 
        new O_meminfo_property(
            'DirectMap4k',
            'Memory mapped with 4kB pages.'
        )
        this.o_meminfo_property_DirectMap2M = 
        new O_meminfo_property(
            'DirectMap2M',
            'Memory mapped with 2MB pages.'
        )
        this.o_meminfo_property_DirectMap1G = 
        new O_meminfo_property(
            'DirectMap1G',
            'Memory mapped with 1GB pages.'
        )
        this.a_o_meminfo_property = Object.keys(this).map(
            s_prop => 
            {
                if(s_prop.startsWith('o_meminfo_property')){
                 return this[s_prop]
                }
                return false
            }
        ).filter(v=>v)
    }
}


class O_webgl_program{ 
    constructor(
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
    ){
        this.o_canvas = o_canvas
        this.o_ctx = o_ctx
        this.a_o_shader_info = a_o_shader_info
        this.o_shader__program = o_shader__program
        this.s_name_a_o_vec_position_vertex = s_name_a_o_vec_position_vertex
        this.o_s_name_o_uniform_location = o_s_name_o_uniform_location
        this.s_context_webgl_version = s_context_webgl_version
        this.o_buffer_position = o_buffer_position
        this.a_o_vec_position_vertex = a_o_vec_position_vertex
        this.o_afloc_a_o_vec_position_vertex = o_afloc_a_o_vec_position_vertex

    }
}

class O_webgl_uniform_location{
    constructor(
        s_name, 
        o_uniform_location, 
        v_data
    ){
        this.s_name = s_name
        this.o_uniform_location = o_uniform_location
        this.v_data = v_data
    }
}
class O_shader_info{
    constructor(
        s_type,
        s_code_shader,
        o_shader, 
        a_o_shader_error, 
        n_ts_ms_start_compile, 
        n_ms_duration_compile
    ){
        this.s_type = s_type
        this.s_code_shader = s_code_shader  ,
        this.o_shader = o_shader  , 
        this.a_o_shader_error = a_o_shader_error,
        this.n_ts_ms_start_compile = n_ts_ms_start_compile, 
        this.n_ms_duration_compile = n_ms_duration_compile  
    }
}
class O_shader_error{
    constructor(
        o_shader_info, 
        s_error_prefix,
        n_idx,
        n_line,
        s_code_content_with_error__quoted,
        s_error_type,
        s_line_code_with_error,
        s_rustlike_error
    ){
        this.o_shader_info = o_shader_info, 
        this.s_error_prefix = s_error_prefix,
        this.n_idx = n_idx,
        this.n_line = n_line,
        this.s_code_content_with_error__quoted = s_code_content_with_error__quoted,
        this.s_error_type = s_error_type,
        this.s_line_code_with_error = s_line_code_with_error,
        this.s_rustlike_error = s_rustlike_error
    }
}

export{
    O_cpu_stats,
    O_cpu_core_stats, 
    O_cpu_stats__diff, 
    O_cpu_core_stats__diff, 
    O_meminfo, 
    O_meminfo_property, 
    O_nvidia_smi_section,
    O_nvidia_smi_metric,
    O_nvidia_smi_help_info, 
    O_number_value, 
    O_webgl_program, 
    O_webgl_uniform_location,
    O_shader_info, 
    O_shader_error
}