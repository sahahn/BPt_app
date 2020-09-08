<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <title>BPt</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="">
  <meta name="author" content="">

  <!-- Base bootstrap -->
  <link href="css/bootstrap.min.css" rel="stylesheet">
  <link href="css/bootstrap-toggle.min.css" rel="stylesheet">
  <link href="css/bootstrap-editable.css" rel="stylesheet">

  <!-- Select2 -->
  <link href="css/select2-bootstrap4.min.css" rel="stylesheet" type="text/css">
  <link href="css/select2.min.css" rel="stylesheet" type="text/css">

  <!-- Font awesome icons -->
  <link href="css/fontawesome-all.min.css" rel="stylesheet">

  <!-- Datatables -->
  <link rel="stylesheet" type="text/css" href="css/dataTables.bootstrap4.min.css">
  <link rel="stylesheet" type="text/css" href="css/buttons.bootstrap4.min.css">

  <!-- Custom styles -->
  <link rel="stylesheet" href="css/style.css">

  <!-- Fav and touch icons
  <link rel="apple-touch-icon-precomposed" sizes="144x144" href="/img/apple-touch-icon-144-precomposed.png">
  <link rel="apple-touch-icon-precomposed" sizes="114x114" href="/img/apple-touch-icon-114-precomposed.png">
  <link rel="apple-touch-icon-precomposed" sizes="72x72" href="/img/apple-touch-icon-72-precomposed.png">
  <link rel="apple-touch-icon-precomposed" href="/img/apple-touch-icon-57-precomposed.png"> -->
  <!-- <link rel="shortcut icon" href="/img/favicon.png"> -->

</head>

<body spellcheck="false">

  <nav class="navbar navbar-dark sticky-top bg-dark flex-md-nowrap p-0">
    <a class="navbar-brand col-md-1 text-center" href="#">BPt</a>
    <a class="col-md-2" href="#"></a>

    <a id="top-text" class="form-control-dark text-white text-center col-md-6" style="padding-left:0px;"></a>
      
    <a class="col-md-1" href="#"></a>
  
    <a class="col-md-auto"><button id="delete-project" type="button" class="btn btn-sm btn-danger" data-toggle="modal"
      data-target="#delete-confirm" style="display:none;">Delete Project <i class="fas fa-trash-alt"></i></button></a>

    <a class="col-md-auto"><button id="save-projects" type="button" class="btn btn-sm btn-success">Save Projects 
        <i class="fas fa-save"></i></button></a> 
  </nav>

  <!-- Nav-bar -->
  <nav class="col-md-1 d-none d-md-block bg-light sidebar">
    <div class="sidebar-static">
      
      <ul class="nav flex-column">
      <!-- This is for when integrated with DEAP
        <li class="nav-item" style="padding-top: 50px;">
          <a class="nav-link" href="/index.php">
            <span><i class="fas fa-home navbutton fa-fw"></i></span> Home
          </a>
        </li>
        -->

        <li class="nav-item" style="padding-top: 50px;">
          <a id="home-but" class="nav-link" href="#">
            <span><i class="fas fa-home navbutton fa-fw"></i></span> Home
          </a>
        </li>

        <li class="nav-item">
          <a id="settings" class="nav-link" href="#">
            <span><i class="fas fa-cogs navbutton fa-fw"></i></span> Settings
          </a>
        </li>

        <li class="nav-item">
          <a id="sets" class="nav-link" href="#">
            <span><i class="fas fa-bars navbutton fa-fw"></i></span> Sets
          </a>
        </li>
        
      </ul>

      <h6 class="nav-link sidebar-heading d-flex justify-content-between align-items-center px-3 mt-2 mb-1 text-muted">
        <span>Projects </span> <a id="add-new-project" href="#"><i class="fas fa-plus navbutton float-right"></i></a>
      </h6>

      <ul class="nav flex-column mb-2" id="projects-list">
      </ul>

    </div>
  </nav>

  <div id='params-modals'></div>
  <div id='submit-modals'></div>

  <!-- Modal for darta source -->
  <div class="modal fade" id="select-data-source" tabindex="-1" role="dialog" aria-labelledby="modal-label" aria-hidden="true">
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title text-center" id="modal-label" style="margin: 0 auto;">
          New Project
          </h5>
          <br>
        </div>

         <div class="modal-body text-center">
          <label for="data=source">Select a source dataset to use with this this project</label>
          <select id="data-source" class="form-control" data-width="100%"></select>

          <button type="button" class="btn btn-secondary" data-dismiss="modal" style="margin-top: 5%;">Close</button>
          <button id="create-project" type="button" class="btn btn-success">Create Project <i class="fas plus"></i></button>

        </div>
      </div>
    </div>
  </div>

  <!-- Store whole main form in here -->
  <div class="container-fluid" style="margin-top: 15px;">
    <div class="row px-5">

      <div class="col-md-1"></div>

      <!-- Modal -->
      <div class="modal fade" id="delete-confirm" tabindex="-1" role="dialog" aria-labelledby="modal-label"
        aria-hidden="true">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title text-center" id="modal-label" style="margin: 0 auto;">

                <button class="btn" style="background-color:transparent;" data-dismiss="modal">
                  <h5><i class="fas fa-book navbutton"></i> <span id='del-project-name'></span></h5>

                </button>

              </h5>
            </div>

            <div class="modal-body text-center">
              <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
              <button id="confirm-delete-project" type="button" class="btn btn-danger">Delete Project <i
                  class="fas fa-trash-alt"></i></button>

            </div>
          </div>
        </div>
      </div>

      <!-- Main Body -->
      <div id="main-body" class="col-md-10">
        <div id="body-db-loading" style="display: none">
          <h1>Please wait... the backend database is still being built!</h1>
          <h3>If you have passed a large amount of data this could take a long time.</h3>
          <h3>Note: You do not need to have this screen up while the uploading is taking place, but
          you should make sure that the docker container is left running (which means do not log or turn off your
          device). That said, if the upload is interupted for whatever reason, you should be able to pick up wherever
          it was left off by returning to this page.</h3>

        </div>
        <div id="body-noproj"></div>
        <div id="body-settings"></div>
        <div id="body-sets"></div>
        <div id="body-setup"></div>
        <div id="body-data-loading"></div>
        <div id="body-val"></div>
        <div id="body-test-split"></div>
        <div id="body-ml-pipe"></div>
        <div id="body-evaluate"></div>
        <div id="body-results"></div>
      </div>

      <div class="col-md-1">
      </div>
    </div>

  </div>

  <!-- Some fixed padding at bottom -->
  <div style="padding-top: 1000px"></div>

  <!-- Base libraries js -->
  <script type="text/javascript" src="js/libraries/jquery-3.2.1.min.js"></script>
  <script type="text/javascript" src="js/libraries/popper.min.js"></script>
  <script type="text/javascript" src="js/libraries/bootstrap.min.js"></script>
  <script type="text/javascript" src="js/libraries/select2.min.js"></script>
  <script type="text/javascript" src="js/libraries/datatables.min.js"></script>
  <script type="text/javascript" src="js/libraries/progressbar.min.js"></script>
  <script type="text/javascript" src="js/libraries/moment.min.js"></script>
  <script type="text/javascript" src="js/libraries/dataTables.buttons.min.js"></script>
  <script type="text/javascript" src="js/libraries/buttons.flash.min.js"></script>
  <script type="text/javascript" src="js/libraries/buttons.html5.min.js"></script>
  <script type="text/javascript" src="js/libraries/jszip.min.js"></script>
  <script type="text/javascript" src="js/libraries/buttons.bootstrap4.min.js"></script>
  <script type="text/javascript" src="js/libraries/pdfmake.min.js"></script>
  <script type="text/javascript" src="js/libraries/vfs_fonts.js"></script>
  <script src="//cdnjs.cloudflare.com/ajax/libs/lodash.js/4.15.0/lodash.min.js"></script>

  
  



  <!-- Main scripts -->
  <script src="js/code/utils.js"></script>
  <script src="js/code/common_html.js"></script>
  <script src="js/code/common_funcs.js"></script>
  <script src="js/code/sets.js"></script>
  <script src="js/code/settings.js"></script>
  <script src="js/code/validate_input.js"></script>
  <script src="js/code/setup.js"></script>
  <script src="js/code/data_loading_html.js"></script>
  <script src="js/code/data_loading.js"></script>
  <script src="js/code/validation.js"></script>
  <script src="js/code/test.js"></script>
  <script src="js/code/scope.js"></script>
  <script src="js/code/pipeline/pipe_html.js"></script>
  <script src="js/code/pipeline/param_dists.js"></script>
  <script src="js/code/pipeline/pipe.js"></script>
  <script src="js/code/evaluate.js"></script>
  <script src="js/code/results.js"></script>
  <script src="js/code/all.js"></script>

</body>

</html>