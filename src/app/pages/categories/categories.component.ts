import {Component, OnInit, ViewChild} from '@angular/core';
import {UtilitiesService} from '../../shared/services/utilities.service';
import {CategoriesService} from '../../shared/services/categories.service';
import {ActivatedRoute} from '@angular/router';
import {ConstantsService} from '../../shared/services/constants.service';
import {environment} from '../../../environments/environment';
import {Subject} from 'rxjs';
import {DataTableDirective} from 'angular-datatables';

declare var $: any;
declare var toastr: any;

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css']
})
export class CategoriesComponent implements OnInit {
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;

  dtTrigger: Subject<any> = new Subject();
  dtOptions: any = {};

  saveFormMode: string;
  saveFormButton: string;
  category: any = {};
  categories: any = {};
  categoryPhoto: any = null;

  categoryUpdateId: number;
  categoryDeleteId: number;

  constructor(private utils: UtilitiesService, private categoriesService: CategoriesService, private route: ActivatedRoute, private consts: ConstantsService) { }

  ngOnInit() {
    this.saveFormMode = 'New';
    this.saveFormButton = 'Save';

    this.dtOptions = {
      pagingType: 'full_numbers',
      pageLength: 10,
      serverSide: true,
      processing: true,
      ajax: (request: any, callback) => {
        this.categoriesService.getCategories(request).subscribe(data => {
          // console.log(data);
          this.categories = data.body;
          callback({
            recordsTotal: data.recordsTotal,
            recordsFiltered: data.recordsFiltered,
            data: [],
          });
        });
      }
    };

    $('#img-placeholder-2').imagepreview({
      input: '[name="imageFile"]',
      reset: '#categoryPhotoClear',
      preview: '.category-photo-placeholder'
    });
  }

  saveCategory(mode: any) {
    if ($('#form-categories').smkValidate()) {
      this.utils.showLoading();
      const formData = new FormData($('#form-categories')[0]);
      if (mode === 'New') {
        this.categoriesService.postCategory(formData).subscribe((response: any) => {
          console.log(response);
          if (response.status === true) {
            this.utils.hideLoading();
            this.category = {};
            this.hideModal();
            this.reloadTable();
            $('#categoryPhotoClear').click();
            toastr.success(response.message);
          } else {
            this.utils.hideLoading();
            toastr.error(response.message);
          }
        }, error => {
          toastr.error('Something went wrong.');
          this.utils.hideLoading();
        });
      } else {
          this.categoriesService.updateCategory(formData, this.categoryUpdateId).subscribe((response: any) => {
            if (response.status === true) {
              this.utils.hideLoading();
              this.reloadTable();
              this.utils.modalToggle(false, '#category-modal');
              toastr.success(response.message);
            } else {
              this.utils.hideLoading();
              this.utils.modalToggle(false, '#category-modal');
              toastr.error(response.message);
            }

          }, error => {
            toastr.error('Something went wrong');
            this.utils.modalToggle(false, '#category-modal');
            this.utils.hideLoading();
          });
      }

    }

  }

  showModal(data: any = false) {
    if (data) {
      this.category = data;
      this.categoryPhoto = environment.baseUrl + 'uploads/' + this.category.imageName;
      this.saveFormButton = 'Update';
      this.saveFormMode = 'Edit';
      this.categoryUpdateId = data.id;
    } else {
      this.category = {};
      this.saveFormMode = 'New';
      this.saveFormButton = 'Save';
    }
    this.utils.modalToggle(true, '#category-modal');
  }

  hideModal() {
    this.utils.modalToggle(false, '#category-modal');
  }

  showDeleteModal(id: number) {
    this.categoryDeleteId = id;
    this.utils.modalToggle(true, '#delete-category-modal');
  }

  deleteCategory(id: number) {
    this.utils.showLoading();
    this.categoriesService.deleteCategory(id).subscribe(
      (response: any) => {
        if (response.status === true) {
          this.reloadTable();
          this.utils.hideLoading();
          this.utils.modalToggle(false, '#delete-category-modal');
          toastr.success('Category deleted successfully');
        } else {
          this.utils.hideLoading();
          this.utils.modalToggle(false, '#delete-category-modal');
          toastr.error('Something went wrong');
        }

      }, error => {
        this.utils.hideLoading();
        this.utils.modalToggle(false, '#delete-category-modal');
        toastr.error('Something went wrong');
      }
    );
  }

  clear() {
    this.category = {};
    this.categoryPhoto = null;
    $('#categoryPhotoClear').click();
  }

  ngAfterViewInit(): void {
    this.dtTrigger.next();
  }

  reloadTable(): void{
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.draw();
    });
  }
}
