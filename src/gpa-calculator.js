require([ "underscore", "jquery", "selectize"], function () {

require('./views/main.less');

//$.fn.gpaCalculator plugin
(function( $ ){
  //DATA
  //--------------------------------------------------
  var GPA_data = {
    grade : require('./data/grade.js'),
    courses : require('./data/courses.js'),
    course_types:  require('./data/course-types.js')
  }

  var GPA_tpl = {
    college : require('./views/college/college.html'),
    college_class : require('./views/college/college-class.html'),
    college_semester :  require('./views/college/college-semester.html'),

    hschool : require('./views/hschool/hschool.html'),
    hschool_course: require('./views/hschool/hschool-course.html'),

    email: require('./views/email.html')
  }

  var selectizePlugin;

  //METHODS
  //--------------------------------------------------
  var methods = {
    init : function( options ) {
      var settings = $.extend( {
        form : 'college' // college, high-school, all-widgets
      }, options);

      return this.each(function() {
        var $this = $(this);
        var data = $this.data('gpa');

        if ( data ) return false;

        $this.data('gpa', {
          target: $this,
          is_sent_email: JSON.parse(localStorage.getItem("gpa_is_sent_email")) || false, //get data from localStorage
          is_valid_email: false,
          common_result: '',
          semester_id: 1
        });

        var widget = $('<div/>');

        data = $this.data('gpa');

        if (settings.form === 'college' || settings.form === 'all-widgets') {
          //apply college template
          var college_tpl = GPA_tpl.college;
          var params = {
            grade: GPA_data.grade,
            tpl_semester: GPA_tpl.college_semester,
            tpl_class: GPA_tpl.college_class
          };

          widget.append(college_tpl(params));

          //handler: add new class (college)
          $this.on('click.gpa', '[data-gpa-college=add-class-btn]', addCollegeClass);

          //handler: add new semester (college)
          var params = {
            target: data.target,
            semester_id: data.semester_id
          };
          $this.on('click.gpa', '[data-gpa-college=add-semester-btn]', params, addCollegeSemester);

          //handler: remove semester (college)
          $this.on('click.gpa', '[data-gpa-college=remove-semester-btn]', removeCollegeSemester);

          //handler: calculate GPA for 1 semester (college)
          $this.on('change.gpa', '[data-gpa-college=grade], [data-gpa-college=credits]', calculateCollegeGPA);
          $this.on('click.gpa', '[data-gpa-college=calculate-btn], [data-gpa=email-send-btn]', calculateCollegeGPA);

          //handler: calculate GPA for all semesters (college)
          var params = {
            target: data.target,
            calculate_common_result: true
          };
          $this.on('change.gpa', '[data-gpa-college=grade], [data-gpa-college=credits]', params, calculateCollegeGPA);
          $this.on('click.gpa', '[data-gpa-college=calculate-btn], [data-gpa-college=remove-semester-btn]', params, calculateCollegeGPA);

          //hendler: allow input only of numbers in the field of gpa-credits
          $this.on('keypress.gpa', '[data-gpa-college=credits]', checkNumber);
        }

        if (settings.form === 'high-school' || settings.form === 'all-widgets') {
          //apply high-school template
          var high_school_tpl = GPA_tpl.hschool;
          var params = {
            grade: GPA_data.grade,
            courses: GPA_data.courses,
            course_types: GPA_data.course_types,
            tpl_course: GPA_tpl.hschool_course
          };

          widget.append(high_school_tpl(params));

          //handler: add new course (hschool)
          $this.on('click.gpa', '[data-gpa-hschool=add-course-btn]', addHSchoolCourse);

          //handler: calculate GPA (hschool)
          $this.on('change.gpa', '[data-gpa-hschool=grade], [data-gpa-hschool=course-types]', calculateHScoolGPA);
          $this.on('click.gpa', '[data-gpa-hschool=calculate-btn]', calculateHScoolGPA);
        }

        //handler: show error if empty fields
        var params = {
          error: 'show'
        };
        $this.on('click.gpa', '[data-gpa-college=calculate-btn], [data-gpa-hschool=calculate-btn]', params, validateFields);
        var params = {
          error: 'hide'
        };
        $this.on('change.gpa', '[data-gpa-college=grade], [data-gpa-college=credits], [data-gpa-hschool=grade], [data-gpa-hschool=course-types]', params, validateFields);

        //if user didn't send the email yet (get data from localStorage)
        if (!data.is_sent_email) {
          //hide GPA result blocks
          $('[data-gpa-college=result-block], [data-gpa-hschool=result-block]', widget).addClass("gpa-result-disabled");

          //handler: show email field
          var params = {
            target: data.target
          };
          $this.on('click.gpa', '[data-gpa-college=calculate-btn], [data-gpa-hschool=calculate-btn]', params, showEmailField);

          //handler: show error if email not valid
          var params = {
            target: data.target
          };
          $this.on('keyup.gpa', '[data-gpa=email]', params, validateEmail);

          //handler: send email
          var params = {
            target: data.target
          };
          $this.on('click.gpa', '[data-gpa=email-send-btn]', params, sendEmail);
          $this.on('keydown.gpa', '[data-gpa=email]', params, function(e) {
            if (e.keyCode === 13) sendEmail.bind(this)(e);
          });
        }

        //render
        $this.html(widget.contents());

        //init selectize jquery plugin
        selectizePlugin = initSelectizePlugin.bind($this)();

      });
    }
  };

  $.fn.gpaCalculator = function( method ) {
    if ( methods[method] ) {
      return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
    } else if ( typeof method === 'object' || ! method ) {
      return methods.init.apply( this, arguments );
    } else {
      $.error( 'Method ' + method + ' does not exist on jQuery.gpaCalculator' );
    }
  };

  //INIT SELECTIZE JQUERY PLUGIN
  //--------------------------------------------------
  function initSelectizePlugin () {
    var grade_opts = {
      options: GPA_data.grade,
      optgroups: [
        {value: 'A', label: 'A'},
        {value: 'B', label: 'B'},
        {value: 'C', label: 'C'},
        {value: 'D', label: 'D'},
        {value: 'F', label: 'F'}
      ],
      valueField: 'value',
      labelField: 'label',
      searchField: 'label',
      sortField: 'id',
      optgroupField:'group',
      plugins: ['optgroup_columns'],
    };

    $('[data-gpa-college=grade], [data-gpa-hschool=grade]', $(this)).selectize(grade_opts);

    var courses_opts = {
      options: GPA_data.courses,
      valueField: 'id',
      labelField: 'label',
      searchField: 'label',
      create: true
    };

    $('[data-gpa-hschool=courses]', $(this)).selectize(courses_opts);

    var course_types_opts = {
      options: GPA_data.course_types,
      valueField: 'value',
      labelField: 'label',
      searchField: 'label'
    };

    $('[data-gpa-hschool=course-types]', $(this)).selectize(course_types_opts);

    return {
      init: function(new_tpl) {
        $(new_tpl).find('[data-gpa-college=grade], [data-gpa-hschool=grade]').selectize(grade_opts);
        $(new_tpl).find('[data-gpa-hschool=courses]').selectize(courses_opts);
        $(new_tpl).find('[data-gpa-hschool=course-types]').selectize(course_types_opts);
      }
    }
  }

  //HANDLERS
  //--------------------------------------------------
  //handler: add new class (college)
  function addCollegeClass () {
    var $container = $(this).closest('[data-gpa-college=form-wrap]').find('[data-gpa-college=classes-wrap]');
    var params = {
      class_id: ++$container.children().length,
      grade: GPA_data.grade
    };
    var tpl = GPA_tpl.college_class(params);
    tpl = $('<div/>').html(tpl).contents(); //convert string to html DOM
    $container.append(tpl);

    //selectize plugin init for new elements
    if (selectizePlugin) selectizePlugin.init(tpl);
  };

  //handler: add new semester (college)
  function addCollegeSemester (e) {
    var $container = $(this).closest('[data-gpa-college=semesters-wrap]');
    var params = {
      semester_id: ++e.data.semester_id,
      grade: GPA_data.grade,
      tpl_class: GPA_tpl.college_class
    };
    var tpl = GPA_tpl.college_semester(params);
    tpl = $('<div/>').html(tpl).contents(); //convert string to html DOM
    $container.append(tpl);

    //change "Add semester" btn to "Remove semester"
    $(this).text('Remove semester').removeAttr('data-gpa-college').attr('data-gpa-college','remove-semester-btn');

    var data =  e.data.target.data('gpa');

    //fide result for new semester if user didn't send the email yet
    if (!data.is_sent_email) {
      $('[data-gpa-college=result-block]', $container).addClass('gpa-result-disabled');
    }

    //show common result for all semesters
    if (data.is_sent_email && $container.children().length > 1) {
      $('[data-gpa-college=common-result-block]', $container).show()
      .find('[data-gpa-college=common-result]').text(data.common_result);
    }

    //selectize plugin init for new elements
    if (selectizePlugin) selectizePlugin.init(tpl);
  }

  //handler: remove semester (college)
  function removeCollegeSemester () {
    var $semester = $(this).closest('[data-gpa-college=semester]');
    var $container = $semester.closest('[data-gpa-calculator=college]');
    $semester.remove();

    if ($container.find('[data-gpa-college=semesters-wrap]').children().length === 1) {
      $('[data-gpa-college=common-result-block]', $container).hide();
    }
  }

  //handler: calculate GPA (college)
  //for 1 or all semesters
  function calculateCollegeGPA (e) {
    //define what data will be counted and where the result will be written
    var calculate_common_result = e.data && e.data.calculate_common_result;

    if (calculate_common_result) {
      var data =  e.data.target.data('gpa');
      var $container =  e.data.target.data('gpa').target.find('[data-gpa-calculator=college]');
      var $result = $('[data-gpa-college=common-result]', $container);
    } else {
      var $container = $(this).closest('[data-gpa-college=form-wrap]');
      var $result = $('[data-gpa-college=result]', $container);
    }

    //save data in a temporary storage
    var tmp = {};
    tmp.grade = [];
    tmp.credits = [];

    $('[data-gpa-college=fields-row]', $container).each(function(i, elem){
      tmp.grade[i] = +$('[data-gpa-college=grade]', this).val();
      tmp.credits[i] = +$('[data-gpa-college=credits]', this).val();
    });

    //calculating
    var count = tmp.grade.length,
      total = 0,
      total_credits = 0,
      gpa_result = 0;

    while (count){
      count--;
      if (!tmp.grade[count] || !tmp.credits[count]) continue;
      total += tmp.grade[count]*tmp.credits[count];
      total_credits += tmp.credits[count];
    }

    gpa_result = Math.round(parseFloat(total/total_credits) * 100) / 100 || 0;
    gpa_result = gpa_result.toFixed(2);

    //show result
    $result.text(gpa_result);

    //save common result in "data" property of the target element
    if (calculate_common_result) data.common_result = gpa_result;
  };

  //handler: allow input only of numbers in the field of gpa-credits
  function checkNumber (e) {
    return (/[0-9]/.test(String.fromCharCode(e.charCode)));
  }

  //handler: add new course (hschool)
  function addHSchoolCourse () {
    var $container = $(this).closest('[data-gpa-hschool=form-wrap]').find('[data-gpa-hschool=courses-wrap]');
    var params = {
      grade: GPA_data.grade,
      courses: GPA_data.courses,
      course_types: GPA_data.course_types,
      course_id: ++$container.children().length
    };
    var tpl = GPA_tpl.hschool_course(params);
    tpl = $('<div/>').html(tpl).contents(); //convert string to html DOM
    $container.append(tpl);

    //selectize plugin init for new elements
    if (selectizePlugin) selectizePlugin.init(tpl);
  };

  //handler: calculate GPA (hschool)
  function calculateHScoolGPA () {
    var $container = $(this).closest('[data-gpa-hschool=form-wrap]');

    //save data in a temporary storage
    var data = {};
    data.grade = [];
    data.course_types = [];

    var $courses = $container.find('[data-gpa-hschool=courses-wrap]');

    $('[data-gpa-hschool=fields-row]', $courses).each(function(i, elem){
      data.grade[i] = +$('[data-gpa-hschool=grade]', this).val();
      data.course_types[i] = +$('[data-gpa-hschool=course-types]', this).val();
    });

    //calculating
    var count = data.grade.length,
      total = 0,
      total_courses = 0,
      gpa_result = 0;

    while (count){
      count--;
      if (!data.grade[count]) continue;
      total += data.grade[count]+data.course_types[count];
      total_courses += 1;
    }
    gpa_result = Math.round(parseFloat(total/total_courses) * 100) / 100 || 0;
    gpa_result = gpa_result.toFixed(2)

    //show result
    $('[data-gpa-hschool=result]', $container).text(gpa_result);
  };

  //handler: show email field
  function showEmailField (e) {
    var data =  e.data.target.data('gpa');

    //show field with email only once (before showing result)
    if (data.is_sent_email) return false;

    //define in what container the "calculate" btn was clicked
    var form = $(this).attr('data-gpa-college') ? 'data-gpa-college' : 'data-gpa-hschool';
    var $container = $(this).closest('['+form+'=form-wrap]');

    //show email field
    var tpl = GPA_tpl.email;
    tpl = $('<div/>').html(tpl).contents(); //convert string to html DOM
    $('['+form+'=calculate-btn]', $container).hide().after(tpl);
  };

  //handler: show error if email not valid
  function checkEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  }

  function validateEmail (e) {
    var data =  e.data.target.data('gpa');
    var $this = $(this);
    var $container = $this.closest('[data-gpa=email-wrap]');

    //if email is valid
    if (checkEmail($this.val())) {
      $container.removeClass('gpa-invalid-email');
      $('[data-gpa=email-msg]', $container).hide();
      $('[data-gpa=email-send-btn]', $container).removeAttr('disabled');
      return data.is_valid_email = true;
    }

    //if email is not valid
    $container.addClass('gpa-invalid-email');
    $('[data-gpa=email-msg]', $container).show();
    $('[data-gpa=email-send-btn]', $container).attr('disabled','disabled');
    return data.is_valid_email = false;
  };

  //handler: show error if empty fields
  function validateFields (e) {
    var form = $(this).attr('data-gpa-college') ? 'data-gpa-college' : 'data-gpa-hschool';
    var $container = $(this).closest('['+form+'=form-wrap]');
    var result = +$container.find('['+form+'=result]').text();
    var $first_row = $container.find('['+form+'=fields-row]').first();
    var $elements = $('['+form+'=grade], ['+form+'=credits], ['+form+'=courses], ['+form+'=course-types]', $first_row);

    //if result is "not 0" & was event "change" after input/select of value
    if (result && e.data.error === 'hide') {
      $elements.removeClass('gpa-empty-data');
      return true;
    }
    //if result is "0" & was event "ckick" on calculate btn
    else if (!result && e.data.error === 'show') {
      $elements.addClass('gpa-empty-data');
    }
    return false;
  }
  //handler: send email
  function sendEmail (e) {
    var data =  e.data.target.data('gpa');
    //console.log( $(data.target).find('[data-gpa-calculator]').attr(form);

    //send only if valid email
    if (!data.is_valid_email) return false;
    var $container = $(this).closest('[data-gpa-calculator]');

    var email = $(this).closest('[data-gpa=email-wrap]').find('[data-gpa=email]').val();
    var form_name = $container.attr('data-gpa-calculator');
    var result = $container.find('[data-gpa-college=common-result]').first().text() ||
                 $container.find('[data-gpa-hschool=result]').text();

    $.ajax({
      url: "/wp-content/special/save-leads.php",
      method: "POST",
      data: {
        email: email,
        form: form_name,
        result: result
      }
    })
    .done(function(){
      var $container = data.target;

      //show calculate btns
      $('[data-gpa-college=calculate-btn], [data-gpa-hschool=calculate-btn]', $container).show();

      //show result blocks (remove class "gpa-result-disabled")
      $('[data-gpa-college=result-block], [data-gpa-hschool=result-block]', $container).removeClass('gpa-result-disabled');

      //show college common-result-block if semesters more then 1
      if ($container.find('[data-gpa-college=semester]').length > 1) {
        $('[data-gpa-college=common-result-block]', $container).show();
      }

      //remove email field
      $('[data-gpa=email-wrap]', $container).remove();

      //set data in localStorage: gpa_is_sent_email : true
      localStorage.setItem("gpa_is_sent_email", JSON.stringify(true));
      return data.is_sent_email = true;
    })
  };

})( jQuery );

//init plugin
$('#gpa-college, .gpa-college').gpaCalculator({form: 'college'});
$('#gpa-high-school, .gpa-high-school').gpaCalculator({form: 'high-school'});
$('#gpa-all-widgets, .gpa-all-widgets').gpaCalculator({form: 'all-widgets'});

});
